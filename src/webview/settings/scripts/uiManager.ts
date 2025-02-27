// src/webview/settings/scripts/uiManager.ts
export function getUiManagerScript(): string {
    return `
      // Show/hide sections based on selected provider
      function updateVisibleSettings() {
        const provider = document.getElementById('apiProvider').value;
        document.getElementById('geminiSettings').style.display =
          provider === 'gemini' ? 'block' : 'none';
        document.getElementById('huggingfaceSettings').style.display =
          provider === 'huggingface' ? 'block' : 'none';
        document.getElementById('ollamaSettings').style.display =
          provider === 'ollama' ? 'block' : 'none';
        document.getElementById('mistralSettings').style.display =
          provider === 'mistral' ? 'block' : 'none';
      }
      
      // Initialize UI state immediately
      updateVisibleSettings();
      
      // Add event listener for future changes
      document.getElementById('apiProvider').addEventListener('change', updateVisibleSettings);
      
      // Toast notification system
      function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type);
        toast.classList.add('show');
        
        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }
      
      // Update status banner with new settings
      function updateStatusBanner(settings) {
        // Get provider-specific model info
        let modelInfo = "";
        switch (settings.apiProvider) {
          case "gemini":
            modelInfo = settings.gemini.model || "gemini-2.0-flash";
            break;
          case "huggingface":
            modelInfo = settings.huggingface.model || "Not configured";
            break;
          case "ollama":
            modelInfo = settings.ollama.model || "Not configured";
            break;
          case "mistral":
            modelInfo = settings.mistral.model || "mistral-large-latest";
            break;
        }
        
        // Get API configuration status
        let apiConfigured = false;
        switch (settings.apiProvider) {
          case "gemini":
            apiConfigured = !!settings.gemini.apiKey;
            break;
          case "huggingface":
            apiConfigured = !!settings.huggingface.apiKey;
            break;
          case "ollama":
            apiConfigured = !!settings.ollama.url;
            break;
          case "mistral":
            apiConfigured = !!settings.mistral.apiKey;
            break;
        }
        
        // Format provider name for display
        const providerDisplay = {
          gemini: "Gemini",
          huggingface: "Hugging Face",
          ollama: "Ollama",
          mistral: "Mistral"
        }[settings.apiProvider] || settings.apiProvider;
        
        const bannerHTML = \`
          <div class="status-banner">
            <h3>Current Configuration</h3>
            <div class="status-grid">
              <div class="status-item">
                <span class="status-label">Active Provider</span>
                <span class="status-value">
                  <span class="status-badge \${settings.apiProvider}">\${providerDisplay}</span>
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">Model</span>
                <span class="status-value">\${modelInfo}</span>
              </div>
              <div class="status-item">
                <span class="status-label">API Status</span>
                <span class="status-value">\${apiConfigured ? "Configured" : "Not Configured"}</span>
              </div>
              <div class="status-item">
                <span class="status-label">Commit Style</span>
                <span class="status-value">\${settings.commit?.verbose ? "Verbose" : "Concise"}</span>
              </div>
            </div>
          </div>
        \`;
        
        const container = document.getElementById('statusBannerContainer');
        container.innerHTML = bannerHTML;
        container.firstElementChild.classList.add('banner-updated');
        
        // Remove animation class after animation completes
        setTimeout(() => {
          const banner = container.firstElementChild;
          if (banner) {
            banner.classList.remove('banner-updated');
          }
        }, 1000);
      }
    `;
}
