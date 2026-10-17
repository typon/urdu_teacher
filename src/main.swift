// Urdu Doodles — a full-screen, keyboard-locked toddler game for macOS.
//
// The game itself is HTML (in game/), shown in a WKWebView. This wrapper:
//   • covers every screen and hides the Dock / menu bar,
//   • blocks app switching, force-quit, Mission Control, Spotlight etc. via a keyboard event tap,
//   • forwards every key press to the game,
//   • quits only on the parent combo:  hold ⌃ control + ⌥ option + ⌘ command, then type B, Y, E.
//     (same three keys + M goes back to the game menu)

import Cocoa
import WebKit
import ApplicationServices

// Holds what the C event-tap callback needs; kept outside the (main-actor) app delegate on purpose.
final class TapBox {
    var tap: CFMachPort?
    weak var delegate: AppDelegate?
}

// Runs for every keyboard / media-key / gesture event in the login session while the game is open.
// Everything is swallowed (return nil); key presses are handed to the game on the main queue.
func keyTapCallback(proxy: CGEventTapProxy, type: CGEventType, event: CGEvent, refcon: UnsafeMutableRawPointer?) -> Unmanaged<CGEvent>? {
    guard let refcon = refcon else { return Unmanaged.passUnretained(event) }
    let box = Unmanaged<TapBox>.fromOpaque(refcon).takeUnretainedValue()
    switch type {
    case .tapDisabledByTimeout, .tapDisabledByUserInput:
        if let t = box.tap { CGEvent.tapEnable(tap: t, enable: true) }
        return Unmanaged.passUnretained(event)
    case .keyDown, .flagsChanged:
        let captured = event
        DispatchQueue.main.async {
            if type == .keyDown { box.delegate?.handleKeyDown(captured) } else { box.delegate?.handleFlags(captured) }
        }
        return nil
    default:
        return nil // key-ups, media/brightness keys, trackpad gestures: swallowed
    }
}

final class KioskWindow: NSWindow {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: KioskWindow!
    var webView: WKWebView!
    var blackouts: [NSWindow] = []
    let tapBox = TapBox()
    var eventTap: CFMachPort?
    var kioskOn = false
    var runLoopSource: CFRunLoopSource?
    var localMonitor: Any?
    var activity: NSObjectProtocol?
    var pageReady = false
    var lockMode = "partial"
    var lastFlags: CGEventFlags = []

    // parent combo: ⌃⌥⌘ held, then B Y E   (macOS virtual key codes)
    let secretCodes: [Int64] = [11, 16, 14]
    let menuCode: Int64 = 46 // M
    var secretIndex = 0
    var secretTime = Date.distantPast

    // MARK: launch

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.mainMenu = NSMenu() // no menu → no ⌘Q, ⌘H, ⌘W

        if !AXIsProcessTrusted() {
            askForAccessibility()
        }

        buildWindows()
        kioskOn = true
        enterKiosk()
        installKeyHandling()

        activity = ProcessInfo.processInfo.beginActivity(
            options: [.idleDisplaySleepDisabled, .userInitiated],
            reason: "A little one is playing")

        NotificationCenter.default.addObserver(self, selector: #selector(screensChanged),
            name: NSApplication.didChangeScreenParametersNotification, object: nil)
    }

    func applicationDidBecomeActive(_ notification: Notification) {
        if kioskOn { enterKiosk() }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func askForAccessibility() {
        let alert = NSAlert()
        alert.messageText = "Let Urdu Doodles lock the keyboard?"
        alert.informativeText = """
        To stop little hands from switching apps, opening Spotlight or quitting, Urdu Doodles needs \
        Accessibility permission (it only uses it to swallow key presses while the game is open).

        1. Click “Open Settings”.
        2. Turn on “Urdu Doodles” under Privacy & Security → Accessibility.
        3. Come back and click “Start Playing”.

        You can also play without it — most keys are still caught, but a few system shortcuts \
        (like ⌘ Space) would get through.
        """
        alert.addButton(withTitle: "Open Settings")
        alert.addButton(withTitle: "Play Without Full Lock")
        alert.addButton(withTitle: "Quit")
        NSApp.activate(ignoringOtherApps: true)
        let r = alert.runModal()
        if r == .alertThirdButtonReturn { NSApp.terminate(nil); return }
        if r == .alertFirstButtonReturn {
            // This also adds the app to the Accessibility list so the parent only has to flip the switch.
            let opts = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
            _ = AXIsProcessTrustedWithOptions(opts)
            if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") {
                NSWorkspace.shared.open(url)
            }
            let wait = NSAlert()
            wait.messageText = "Switch on Urdu Doodles, then come back"
            wait.informativeText = "Once “Urdu Doodles” is turned on in Accessibility, click Start Playing. (If it still isn't locked, quit with ⌃⌥⌘ + B Y E and open the app again.)"
            wait.addButton(withTitle: "Start Playing")
            NSApp.activate(ignoringOtherApps: true)
            wait.runModal()
        }
    }

    // MARK: windows

    func buildWindows() {
        guard let main = NSScreen.main ?? NSScreen.screens.first else { return }

        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []

        webView = WKWebView(frame: main.frame, configuration: config)
        webView.navigationDelegate = self
        webView.allowsMagnification = false
        webView.allowsBackForwardNavigationGestures = false

        window = KioskWindow(contentRect: main.frame, styleMask: [.borderless], backing: .buffered, defer: false)
        window.level = NSWindow.Level(rawValue: Int(CGShieldingWindowLevel()))
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary, .ignoresCycle]
        window.backgroundColor = NSColor(calibratedRed: 0.98, green: 0.95, blue: 0.89, alpha: 1)
        window.isOpaque = true
        window.hasShadow = false
        window.contentView = webView
        window.setFrame(main.frame, display: true)
        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(webView)

        rebuildBlackouts()

        if let gameDir = Bundle.main.resourceURL?.appendingPathComponent("game"),
           FileManager.default.fileExists(atPath: gameDir.path) {
            webView.loadFileURL(gameDir.appendingPathComponent("index.html"), allowingReadAccessTo: gameDir)
        } else {
            webView.loadHTMLString("<h1 style='font-family:sans-serif'>Game files missing — please re-run build.sh</h1>", baseURL: nil)
        }
    }

    // Other displays get a plain cover so little fingers can't click into other apps there.
    func rebuildBlackouts() {
        blackouts.forEach { $0.orderOut(nil) }
        blackouts.removeAll()
        guard let main = window?.screen ?? NSScreen.main else { return }
        for screen in NSScreen.screens where screen != main {
            let w = KioskWindow(contentRect: screen.frame, styleMask: [.borderless], backing: .buffered, defer: false)
            w.level = window.level
            w.backgroundColor = NSColor(calibratedRed: 0.98, green: 0.95, blue: 0.89, alpha: 1)
            w.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
            w.setFrame(screen.frame, display: true)
            w.orderFront(nil)
            blackouts.append(w)
        }
    }

    @objc func screensChanged() {
        if let main = NSScreen.main {
            window.setFrame(main.frame, display: true)
        }
        rebuildBlackouts()
    }

    func enterKiosk() {
        NSApp.activate(ignoringOtherApps: true)
        NSApp.presentationOptions = [
            .hideDock, .hideMenuBar,
            .disableProcessSwitching, .disableForceQuit,
            .disableSessionTermination, .disableHideApplication,
            .disableAppleMenu,
        ]
        window?.makeKeyAndOrderFront(nil)
    }

    // MARK: keyboard

    func installKeyHandling() {
        installEventTap()

        // Fallback (and belt-and-braces): anything that still reaches the app is swallowed here.
        localMonitor = NSEvent.addLocalMonitorForEvents(matching: [.keyDown, .keyUp, .flagsChanged, .systemDefined]) { [weak self] event in
            guard let self = self else { return nil }
            if let cg = event.cgEvent {
                switch event.type {
                case .keyDown: self.handleKeyDown(cg)
                case .flagsChanged: self.handleFlags(cg)
                default: break
                }
            }
            return nil
        }
    }

    func installEventTap() {
        guard AXIsProcessTrusted() else { setLock("partial"); return }
        var keys: CGEventMask = 0
        for t: CGEventType in [.keyDown, .keyUp, .flagsChanged] { keys |= (CGEventMask(1) << CGEventMask(t.rawValue)) }
        var extra: CGEventMask = 0
        extra |= (CGEventMask(1) << 14) // system-defined: volume, brightness, media keys
        extra |= (CGEventMask(1) << 29) // trackpad gestures
        extra |= (CGEventMask(1) << 30) // magnify / dock gestures

        tapBox.delegate = self
        let refcon = Unmanaged.passUnretained(tapBox).toOpaque()
        var tap = CGEvent.tapCreate(tap: .cgSessionEventTap, place: .headInsertEventTap, options: .defaultTap,
                                    eventsOfInterest: keys | extra, callback: keyTapCallback, userInfo: refcon)
        if tap == nil {
            tap = CGEvent.tapCreate(tap: .cgSessionEventTap, place: .headInsertEventTap, options: .defaultTap,
                                    eventsOfInterest: keys, callback: keyTapCallback, userInfo: refcon)
        }
        guard let t = tap else { setLock("partial"); return }
        eventTap = t
        tapBox.tap = t
        runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, t, 0)
        CFRunLoopAddSource(CFRunLoopGetMain(), runLoopSource, .commonModes)
        CGEvent.tapEnable(tap: t, enable: true)
        setLock("full")
    }

    func handleFlags(_ event: CGEvent) {
        let interesting: CGEventFlags = [.maskShift, .maskControl, .maskAlternate, .maskCommand, .maskSecondaryFn, .maskAlphaShift]
        let now = event.flags.intersection(interesting)
        let pressedNew = !now.subtracting(lastFlags).isEmpty
        lastFlags = now
        if pressedNew {
            let code = event.getIntegerValueField(.keyboardEventKeycode)
            sendMash(chars: "", code: code)
        }
    }

    func handleKeyDown(_ event: CGEvent) {
        let code = event.getIntegerValueField(.keyboardEventKeycode)
        let isRepeat = event.getIntegerValueField(.keyboardEventAutorepeat) != 0
        let f = event.flags
        let parentHeld = f.contains(.maskControl) && f.contains(.maskAlternate) && f.contains(.maskCommand)

        if parentHeld && !isRepeat {
            if code == menuCode { secretIndex = 0; callJS("window.urduMenu && window.urduMenu()"); return }
            if secretIndex > 0 && Date().timeIntervalSince(secretTime) > 4 { secretIndex = 0 }
            if code == secretCodes[secretIndex] {
                secretIndex += 1
                secretTime = Date()
                if secretIndex == secretCodes.count { quitForReal(); return }
                return
            } else if code == secretCodes[0] {
                secretIndex = 1; secretTime = Date(); return
            } else {
                secretIndex = 0
            }
        } else if !isRepeat {
            secretIndex = 0
        }

        if isRepeat { return } // holding a key down shouldn't machine-gun the game
        var chars = ""
        if let ns = NSEvent(cgEvent: event), let c = ns.charactersIgnoringModifiers { chars = c }
        sendMash(chars: chars, code: code)
    }

    func sendMash(chars: String, code: Int64) {
        guard pageReady else { return }
        let safe = chars.unicodeScalars.filter { $0.value >= 0x20 && $0.value < 0xF700 }.map(String.init).joined()
        let payload: [String: Any] = ["ch": String(safe.prefix(1)), "kc": code]
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else { return }
        callJS("window.urduMash && window.urduMash(\(json))")
    }

    func callJS(_ js: String) {
        webView?.evaluateJavaScript(js, completionHandler: nil)
    }

    func setLock(_ mode: String) {
        lockMode = mode
        if pageReady { callJS("window.urduSetLock && window.urduSetLock('\(mode)')") }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        pageReady = true
        callJS("window.urduSetLock && window.urduSetLock('\(lockMode)')")
    }

    func quitForReal() {
        if let tap = eventTap { CGEvent.tapEnable(tap: tap, enable: false) }
        if let src = runLoopSource { CFRunLoopRemoveSource(CFRunLoopGetMain(), src, .commonModes) }
        if let m = localMonitor { NSEvent.removeMonitor(m) }
        if let a = activity { ProcessInfo.processInfo.endActivity(a) }
        kioskOn = false
        NSApp.presentationOptions = []
        NSApp.terminate(nil)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
