
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';

interface MemeTemplate {
  id: number;
  url: string;
  name: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  // State
  currentImage = signal<string | null>(null);
  topText = signal('');
  bottomText = signal('');
  fontSize = signal(40);
  isAnalyzing = signal(false);
  isEditing = signal(false);
  magicCaptions = signal<string[]>([]);
  analysisResult = signal<string | null>(null);
  editPrompt = signal('');

  templates: MemeTemplate[] = [
    { id: 1, url: 'https://picsum.photos/id/237/600/600', name: 'Grumpy Dog' },
    { id: 2, url: 'https://picsum.photos/id/1025/600/600', name: 'Sleeping Cat' },
    { id: 3, url: 'https://picsum.photos/id/1012/600/600', name: 'Pensive Man' },
    { id: 4, url: 'https://picsum.photos/id/1062/600/600', name: 'Epic Vista' },
    { id: 5, url: 'https://picsum.photos/id/200/600/600', name: 'The Cow' },
  ];

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentImage.set(e.target?.result as string);
        this.magicCaptions.set([]);
        this.analysisResult.set(null);
      };
      reader.readAsDataURL(file);
    }
  }

  selectTemplate(url: string) {
    this.currentImage.set(url);
    this.magicCaptions.set([]);
    this.analysisResult.set(null);
  }

  async generateMagicCaptions() {
    const img = this.currentImage();
    if (!img) return;

    this.isAnalyzing.set(true);
    try {
      const captions = await this.geminiService.getMagicCaptions(img);
      this.magicCaptions.set(captions);
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  async runAnalysis() {
    const img = this.currentImage();
    if (!img) return;
    this.isAnalyzing.set(true);
    try {
      const result = await this.geminiService.analyzeImage(img);
      this.analysisResult.set(result);
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  async handleImageEdit() {
    const img = this.currentImage();
    const prompt = this.editPrompt();
    if (!img || !prompt) return;

    this.isEditing.set(true);
    try {
      const newImageUrl = await this.geminiService.editImage(img, prompt);
      this.currentImage.set(newImageUrl);
      this.editPrompt.set('');
    } catch (e) {
      alert("Failed to edit image. AI generation might be restricted for this content.");
    } finally {
      this.isEditing.set(false);
    }
  }

  applyCaption(caption: string) {
    // Simple logic: if top text is empty, fill it. Otherwise, put it in bottom.
    if (!this.topText()) {
      this.topText.set(caption);
    } else {
      this.bottomText.set(caption);
    }
  }

  downloadMeme() {
    // In a real app, we'd draw to canvas and download. 
    // Here we'll simulate or just log.
    alert("In this demo environment, please take a screenshot of your masterpiece!");
  }

  reset() {
    this.topText.set('');
    this.bottomText.set('');
    this.currentImage.set(null);
    this.magicCaptions.set([]);
    this.analysisResult.set(null);
  }
}
