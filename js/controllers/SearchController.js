export class SearchController {
    constructor(searchService, productService) {
        this.searchService = searchService;
        this.productService = productService;
        this.searchInput = document.getElementById('searchInput');
        this.searchSuggestions = document.getElementById('searchSuggestions');
        this.voiceSearchBtn = document.getElementById('voiceSearchBtn');
        this.recognition = null;
    }

    init() {
        this.searchInput.addEventListener('input', () => this.handleInput());
        this.searchInput.addEventListener('focus', () => this.handleInput());
        document.addEventListener('click', (e) => {
            if (!this.searchSuggestions.contains(e.target)) {
                this.hideSuggestions();
            }
        });
        this.setupVoiceSearch();
    }

    async handleInput() {
        const query = this.searchInput.value.trim();
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }

        const suggestions = await this.searchService.getSuggestions(query);
        this.renderSuggestions(suggestions);
    }

    renderSuggestions(suggestions) {
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        this.searchSuggestions.innerHTML = suggestions.map(s => `<div class="search-suggestion">${s}</div>`).join('');
        this.searchSuggestions.style.display = 'block';

        this.searchSuggestions.querySelectorAll('.search-suggestion').forEach(item => {
            item.addEventListener('click', () => {
                this.searchInput.value = item.textContent;
                this.hideSuggestions();
                document.getElementById('searchBtn').click();
            });
        });
    }

    hideSuggestions() {
        this.searchSuggestions.style.display = 'none';
    }

    setupVoiceSearch() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                this.searchInput.value = speechResult;
                document.getElementById('searchBtn').click();
            };

            this.recognition.onspeechend = () => {
                this.recognition.stop();
                this.voiceSearchBtn.classList.remove('recording');
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                this.voiceSearchBtn.classList.remove('recording');
            };
            
            this.voiceSearchBtn.addEventListener('click', () => this.startVoiceSearch());

        } else {
            this.voiceSearchBtn.style.display = 'none';
        }
    }
    
    startVoiceSearch() {
        if (this.recognition) {
            this.recognition.start();
            this.voiceSearchBtn.classList.add('recording');
        }
    }
}
