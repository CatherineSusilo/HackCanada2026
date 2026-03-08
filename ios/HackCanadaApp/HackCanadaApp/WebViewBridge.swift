import Foundation
import WebKit
import SwiftUI
import Combine

class WebViewStore: ObservableObject {
    @Published var webView: WKWebView?

    func sendMetrics(_ metrics: VitalsMetrics) {
        guard let webView = webView else { return }

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        guard let jsonData = try? encoder.encode(metrics),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            return
        }

        let script = "window.receiveVitalsData(\(jsonString));"
        DispatchQueue.main.async {
            webView.evaluateJavaScript(script) { result, error in
                if let error = error {
                    print("Error sending metrics to web: \(error)")
                }
            }
        }
    }
}

struct WebView: UIViewRepresentable {
    @ObservedObject var webViewStore: WebViewStore
    @ObservedObject var spectraManager: SmartSpectraManager

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(context.coordinator, name: "storyDriftBridge")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator

        #if DEBUG
        // Replace with your Mac's local IP address
        if let url = URL(string: "http://10.200.9.45:5174") {
            webView.load(URLRequest(url: url))
        }
        #else
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "dist") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        #endif

        webViewStore.webView = webView
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: WebView

        init(_ parent: WebView) {
            self.parent = parent
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "storyDriftBridge",
                  let body = message.body as? [String: Any],
                  let action = body["action"] as? String else {
                return
            }

            switch action {
            case "startMonitoring":
                parent.spectraManager.startMonitoring()
            case "stopMonitoring":
                parent.spectraManager.stopMonitoring()
            default:
                break
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            let script = """
            window.storyDriftBridge = {
                startMonitoring: function() {
                    window.webkit.messageHandlers.storyDriftBridge.postMessage({
                        action: 'startMonitoring'
                    });
                },
                stopMonitoring: function() {
                    window.webkit.messageHandlers.storyDriftBridge.postMessage({
                        action: 'stopMonitoring'
                    });
                }
            };

            window.receiveVitalsData = function(data) {
                window.dispatchEvent(new CustomEvent('vitalsUpdate', { detail: data }));
            };
            """
            webView.evaluateJavaScript(script)
        }
    }
}
