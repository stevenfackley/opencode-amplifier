// A representative MODERN Angular standalone feature (v17+), annotated for a mobile dev who must
// REPRODUCE its behavior. The `// ->` comments point at what to extract and where it maps.

import { Component, inject, signal } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

// === SERVICE: the API contract + shared state. Reuse this contract on mobile. =================
@Injectable({ providedIn: 'root' })
export class WidgetService {
  private http = inject(HttpClient);

  // -> Same backend your mobile app calls. Endpoint + shapes = the contract for swift-api-client.
  getWidgets() {
    return this.http.get<WidgetDto[]>('/api/widgets');          // GET /api/widgets -> WidgetDto[]
  }
  createWidget(body: CreateWidget) {
    return this.http.post<WidgetDto>('/api/widgets', body);     // POST /api/widgets -> WidgetDto
  }
}

export interface WidgetDto { id: string; displayName: string; qty: number; }
export interface CreateWidget { displayName: string; qty: number; }

// === COMPONENT: screen state + form + validation + UX states. ================================
@Component({
  selector: 'app-widgets',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <!-- -> These control-flow blocks ARE the UX spec: loading / error / list / empty states. -->
    @if (loading()) {
      <app-spinner />
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
    } @else {
      @for (w of widgets(); track w.id) {
        <div>{{ w.displayName }} ×{{ w.qty }}</div>
      } @empty {
        <p>No widgets yet</p>
      }
    }
  `,
})
export class WidgetsComponent {
  private svc = inject(WidgetService);
  private fb = inject(FormBuilder);

  // -> Component signals = this screen's view-model state. Map to @Observable / [ObservableProperty].
  widgets = signal<WidgetDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // -> Reactive-form validators = business rules. REPRODUCE THESE EXACTLY on mobile (mismatch = bug).
  form = this.fb.group({
    displayName: ['', [Validators.required, Validators.maxLength(40)]],
    qty: [1, [Validators.required, Validators.min(1)]],
  });

  // -> RxJS .subscribe() = async data flow. On mobile this becomes async/await with a typed client.
  load() {
    this.loading.set(true);
    this.svc.getWidgets().subscribe({
      next: (w) => { this.widgets.set(w); this.loading.set(false); },
      error: (e) => { this.error.set(String(e)); this.loading.set(false); },
    });
  }
}
