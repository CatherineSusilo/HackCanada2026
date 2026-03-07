import SwiftUI
import SmartSpectraSwiftSDK
import WebKit

struct ContentView: View {
    @StateObject private var spectraManager = SmartSpectraManager()
    @StateObject private var webViewStore = WebViewStore()
    
    init() {
        // Set your Presage API key
        let apiKey = "-"
        SmartSpectraSwiftSDK.shared.setApiKey(apiKey)
    }
    
    var body: some View {
        ZStack {
            // Web view displaying your React app
            WebView(webViewStore: webViewStore, spectraManager: spectraManager)
                .edgesIgnoringSafeArea(.all)
            
            // SmartSpectra overlay for vitals monitoring
            VStack {
                Spacer()
                
                if spectraManager.isMonitoring {
                    SmartSpectraView()
                        .frame(width: 120, height: 120)
                        .cornerRadius(12)
                        .padding()
                        .onReceive(spectraManager.metricsPublisher) { metrics in
                            // Send metrics to web view
                            webViewStore.sendMetrics(metrics)
                        }
                }
            }
        }
        .onAppear {
            spectraManager.startMonitoring()
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
