# AGENTS.md - Angular 20 Projekt

## 📋 Projektübersicht

Dieses Projekt nutzt **Angular 20** mit **Standalone Components**, **Signals API**, **TypeScript 5.7+**, **Tailwind CSS**, **SurrealDB** Echtzeit-Integration und modernen Accessibility Standards (WCAG 2.1 AA).

**Hinweis:** Diese Datei wird automatisch von GitHub Copilot, Cursor, Claude und anderen AI-Coding-Assistenten gelesen.

---

## 🚨 Kritische Regeln (Non-Negotiable)

### Angular 20 Standards

```typescript
// ❌ ABSOLUT VERBOTEN
@Component({ standalone: true })          // ← Standard, NICHT explizit setzen!
*ngIf, *ngFor, *ngSwitch                   // ← Legacy Syntax
@Input(), @Output()                        // ← Decorators
constructor(private http: HttpClient) {}   // ← Constructor Injection

// ✅ IMMER verwenden
@if, @for, @switch                         // Native Control Flow
input(), output(), model()                 // Signal-based APIs
private http = inject(HttpClient)          // inject() Function
track bei @for                             // Mandatory!
```

***

## 1️⃣ Projektstruktur & Architektur

```
src/
├── app/
│   ├── core/                          # Singleton Services, Guards, Interceptors
│   │   ├── services/
│   │   │   ├── auth.service.ts       # Authentication
│   │   │   ├── api.service.ts        # HTTP Base Service
│   │   │   ├── surreal-db.service.ts # SurrealDB Echtzeit
│   │   │   └── error-handler.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   └── error.interceptor.ts
│   │   └── models/
│   │       ├── user.model.ts
│   │       └── api-response.model.ts
│   │
│   ├── shared/                        # Reusable UI Components
│   │   ├── components/
│   │   │   ├── button/
│   │   │   │   ├── button.component.ts
│   │   │   │   ├── button.component.html
│   │   │   │   └── button.component.scss
│   │   │   ├── dialog/
│   │   │   ├── loading/
│   │   │   └── notification/
│   │   ├── directives/
│   │   │   ├── highlight.directive.ts
│   │   │   └── click-outside.directive.ts
│   │   └── pipes/
│   │       ├── format-date.pipe.ts
│   │       └── truncate.pipe.ts
│   │
│   ├── features/                      # Domain-based Feature Modules
│   │   ├── users/
│   │   │   ├── user-list.component.ts
│   │   │   ├── user-detail.component.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.routes.ts
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts
│   │   │   └── dashboard.routes.ts
│   │   └── admin/
│   │       └── admin.routes.ts
│   │
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
│
├── assets/
│   ├── images/
│   ├── fonts/
│   └── i18n/
│       ├── de.json
│       ├── en.json
│       └── fr.json
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
├── styles/
│   ├── tailwind.css
│   ├── globals.scss
│   └── theme/
│       ├── light.scss
│       └── dark.scss
│
└── main.ts
```

***

## 2️⃣ Komponenten-Pattern (Modern)

### Standard Component Structure

```typescript
import { Component, input, output, model, computed, inject, signal, effect, DestroyRef, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'

@Component({
  selector: 'app-user-card',
  standalone: true,  // ← OPTIONAL (ist Standard)
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,  // ALWAYS!
  host: {
    '[class.active]': 'isActive()',
    '[attr.aria-label]': 'ariaLabel()',
    '[role]': '"region"',
    '(click)': 'handleClick()',
    '(keydown.enter)': 'handleKeyboardActivation()'
  },
  template: `
    @if (user(); as userData) {
      <div class="card rounded-lg border border-gray-200 p-4">
        <h3 class="font-bold text-lg">{{ displayName() }}</h3>
        <p class="text-gray-600">{{ userData.email }}</p>
        
        @if (userData.badges.length > 0) {
          <div class="mt-4 flex flex-wrap gap-2">
            @for (badge of userData.badges; track badge.id) {
              <span class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                {{ badge.name }}
              </span>
            }
          </div>
        } @else {
          <p class="mt-4 text-sm text-gray-500">No badges yet</p>
        }
        
        <button 
          (click)="deleteUser()"
          class="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          [attr.aria-label]="'Delete ' + displayName()">
          Delete
        </button>
      </div>
    } @else if (isLoading()) {
      <div class="animate-pulse rounded-lg bg-gray-200 p-4" aria-busy="true">
        Loading...
      </div>
    } @else {
      <p class="text-gray-500">User not found</p>
    }
  `,
  styles: [`
    :host {
      display: block;
      padding: 1rem;
    }
    :host(.active) {
      border: 2px solid blue;
      border-radius: 0.5rem;
    }
  `]
})
export class UserCardComponent {
  // ========== Input Signals (ALWAYS readonly) ==========
  readonly user = input.required<User>()
  readonly isLoading = input<boolean>(false)
  readonly theme = input<'light' | 'dark'>('light')
  
  // ========== Output Signals (ALWAYS readonly) ==========
  readonly userClicked = output<User>()
  readonly userDeleted = output<string>()
  
  // ========== Two-Way Binding (Model) ==========
  readonly selected = model<boolean>(false)
  
  // ========== Services Injection ==========
  private readonly userService = inject(UserService)
  private readonly destroyRef = inject(DestroyRef)
  private readonly notificationService = inject(NotificationService)
  
  // ========== Local State (Signals) ==========
  private isDeleting = signal(false)
  
  // ========== Computed Signals (protected für Template) ==========
  protected isActive = computed(() => this.selected())
  protected displayName = computed(() => {
    const userData = this.user()
    return `${userData.firstName} ${userData.lastName}`
  })
  protected ariaLabel = computed(() => 
    `User card for ${this.displayName()} with ${this.user().badges.length} badges`
  )
  
  // ========== Effects (für Side-Effects) ==========
  private userChangeEffect = effect(() => {
    const userData = this.user()
    console.log('User data changed:', userData)
    // Hier könnten Tracking oder andere Side-Effects erfolgen
  })
  
  // ========== Lifecycle ==========
  ngOnInit() {
    this.setupCleanup()
  }
  
  // ========== Private Methods ==========
  private setupCleanup() {
    this.destroyRef.onDestroy(() => {
      console.log('Component cleanup')
    })
  }
  
  // ========== Protected Methods (für Template) ==========
  protected handleClick() {
    this.userClicked.emit(this.user())
  }
  
  protected handleKeyboardActivation() {
    this.handleClick()
  }
  
  protected deleteUser() {
    if (this.isDeleting()) return
    
    this.isDeleting.set(true)
    const userId = this.user().id
    
    this.userService.delete(userId).subscribe({
      next: () => {
        this.notificationService.show('User deleted successfully', 'success')
        this.userDeleted.emit(userId)
      },
      error: (error) => {
        this.notificationService.show('Failed to delete user', 'error')
        console.error('Delete error:', error)
      },
      complete: () => this.isDeleting.set(false)
    })
  }
}
```

***

## 3️⃣ Tailwind CSS Integration

### Setup & Konfiguration

```typescript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,ts,tsx,jsx,js}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}

// styles.scss
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

// Custom component classes
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition;
  }
  .btn-secondary {
    @apply px-4 py-2 bg-secondary text-white rounded-lg hover:bg-purple-700 transition;
  }
  .card {
    @apply rounded-lg border border-gray-200 bg-white shadow-sm;
  }
}
```

### Best Practices

```typescript
// ✅ RICHTIG - Utility-First Approach
<div class="flex gap-4 rounded-lg border border-gray-200 p-4">
  <h3 class="font-bold text-lg text-gray-900">Title</h3>
</div>

// ❌ FALSCH - Custom Globals
<div class="my-custom-card">
  <h3 class="my-title">Title</h3>
</div>

// ✅ RICHTIG - Komponenten-Klassen in @layer components
@layer components {
  .form-input {
    @apply block w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500;
  }
}

// ✅ Responsive Design mit Tailwind
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Items -->
</div>

// ✅ Dark Mode Support
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

***

## 4️⃣ SurrealDB Real-Time Integration

### Service Setup

```typescript
// core/services/surreal-db.service.ts
import { Injectable, signal, computed } from '@angular/core'
import { Surreal } from 'surrealdb'
import { firstValueFrom, Subject, Observable } from 'rxjs'

interface LiveQueryData<T> {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  result: T
}

@Injectable({ providedIn: 'root' })
export class SurrealDbService {
  private db: Surreal | null = null
  private connectionSignal = signal(false)
  private liveQueries = new Map<string, () => void>()
  
  readonly isConnected = this.connectionSignal.asReadonly()
  
  async connect(url: string, namespace: string, database: string, username: string, password: string) {
    try {
      this.db = new Surreal()
      await this.db.connect(url, {
        namespace,
        database,
        auth: { username, password }
      })
      this.connectionSignal.set(true)
      console.log('SurrealDB connected')
    } catch (error) {
      console.error('SurrealDB connection failed:', error)
      this.connectionSignal.set(false)
      throw error
    }
  }
  
  // ========== Query Methods ==========
  
  async query<T>(sql: string, vars?: Record<string, any>): Promise<T[]> {
    if (!this.db) throw new Error('Database not connected')
    const result = await this.db.query<T[]>(sql, vars)
    return result[0]?.result || []
  }
  
  async create<T>(table: string, data: Partial<T>): Promise<T> {
    if (!this.db) throw new Error('Database not connected')
    const result = await this.db.create<T>(table, data)
    return result as T
  }
  
  async update<T>(recordId: string, data: Partial<T>): Promise<T> {
    if (!this.db) throw new Error('Database not connected')
    const result = await this.db.merge<T>(recordId, data)
    return result as T
  }
  
  async delete(recordId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not connected')
    await this.db.delete(recordId)
    return true
  }
  
  // ========== Live Query (Real-Time) ==========
  
  liveQuery<T>(
    sql: string, 
    vars?: Record<string, any>
  ): Observable<LiveQueryData<T>> {
    if (!this.db) throw new Error('Database not connected')
    
    return new Observable(observer => {
      (async () => {
        try {
          const uuid = await this.db!.live<T>(sql, async (update) => {
            observer.next({
              action: update.action,
              result: update.result
            })
          }, { vars })
          
          const queryId = uuid.toString()
          this.liveQueries.set(queryId, async () => {
            await this.db!.kill(uuid)
          })
          
          return () => {
            const unsubscribe = this.liveQueries.get(queryId)
            if (unsubscribe) {
              unsubscribe()
              this.liveQueries.delete(queryId)
            }
          }
        } catch (error) {
          observer.error(error)
        }
      })()
    })
  }
  
  // ========== Cleanup ==========
  
  async disconnect() {
    for (const unsubscribe of this.liveQueries.values()) {
      await unsubscribe()
    }
    this.liveQueries.clear()
    
    if (this.db) {
      await this.db.close()
      this.connectionSignal.set(false)
    }
  }
}

// ========== Usage in Component ==========

@Component({...})
export class UserListComponent {
  private readonly surrealDb = inject(SurrealDbService)
  private readonly destroyRef = inject(DestroyRef)
  
  users = signal<User[]>([])
  isLoading = signal(true)
  error = signal<string | null>(null)
  
  ngOnInit() {
    this.setupLiveQuery()
  }
  
  private setupLiveQuery() {
    const subscription = this.surrealDb
      .liveQuery<User>('LIVE SELECT * FROM user')
      .subscribe({
        next: (update) => {
          this.handleUpdate(update)
        },
        error: (error) => {
          this.error.set('Failed to load users')
          console.error('Live query error:', error)
        }
      })
    
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe()
    })
  }
  
  private handleUpdate(update: LiveQueryData<User>) {
    this.users.update(users => {
      switch (update.action) {
        case 'CREATE':
          return [...users, update.result]
        case 'UPDATE':
          return users.map(u => u.id === update.result.id ? update.result : u)
        case 'DELETE':
          return users.filter(u => u.id !== update.result.id)
      }
    })
  }
}
```

***

## 5️⃣ Accessibility (WCAG 2.1 AA)

### Core A11y Patterns

```typescript
import { LiveAnnouncer } from '@angular/cdk/a11y'
import { FocusMonitor } from '@angular/cdk/a11y'

@Component({
  template: `
    <!-- Skip Navigation Link -->
    <a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>
    
    <!-- Semantic HTML -->
    <nav role="navigation" aria-label="Main navigation">
      <ul>
        <li><a href="/users">Users</a></li>
        <li><a href="/settings">Settings</a></li>
      </ul>
    </nav>
    
    <!-- Form with ARIA -->
    <form [attr.aria-label]="'User registration form'">
      <label for="email">Email address</label>
      <input 
        id="email" 
        type="email" 
        [attr.aria-describedby]="emailError() ? 'email-error' : null"
        required
      />
      @if (emailError()) {
        <span id="email-error" class="text-red-600" role="alert">
          {{ emailError() }}
        </span>
      }
    </form>
    
    <!-- Live Region für Announcements -->
    <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
      {{ announcement() }}
    </div>
    
    <!-- Dialog/Modal with Focus Management -->
    <dialog [attr.aria-labelledby]="'dialog-title'" (keydown.escape)="closeDialog()">
      <h2 id="dialog-title">Confirm Action</h2>
      <p>Are you sure?</p>
      <button (click)="confirm()">Yes</button>
      <button (click)="closeDialog()">No</button>
    </dialog>
  `
})
export class AccessibilityComponent {
  private readonly liveAnnouncer = inject(LiveAnnouncer)
  private readonly focusMonitor = inject(FocusMonitor)
  
  announcement = signal<string>('')
  emailError = signal<string | null>(null)
  
  // Announce messages to screen readers
  announceSuccess() {
    this.liveAnnouncer.announce('User created successfully', 'polite')
  }
  
  announceError() {
    this.liveAnnouncer.announce('An error occurred. Please try again.', 'assertive')
  }
  
  // Focus Management
  closeDialog() {
    // Dialog schließen und Focus zurückgeben
  }
}

// Accessibility ESLint Rules (enabled in .eslintrc.json)
{
  "@angular-eslint/template/accessibility-alt-text": "error",
  "@angular-eslint/template/accessibility-label-for": "error",
  "@angular-eslint/template/accessibility-valid-aria": "error",
  "@angular-eslint/template/click-events-have-key-events": "error",
  "@angular-eslint/template/mouse-events-have-key-events": "error",
  "@angular-eslint/template/no-positive-tabindex": "error"
}

// Utility-Klassen für A11y
// globals.scss
.sr-only {
  @apply absolute w-px h-px p-0 m-px overflow-hidden whitespace-nowrap border-0;
}

.sr-only:not(:focus):not(:active) {
  clip: rect(0, 0, 0, 0);
}

.focus-visible {
  @apply outline-2 outline-offset-2 outline-blue-500;
}
```

***

## 6️⃣ Internationalization (i18n)

### Setup

```typescript
// app.config.ts
import { ApplicationConfig, provideI18n } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    // ... andere Provider
    provideI18n({
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'de', 'fr']
    })
  ]
}

// core/services/i18n.service.ts
import { Injectable, signal, computed } from '@angular/core'
import { HttpClient } from '@angular/common/http'

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient)
  private currentLanguage = signal('en')
  private translations = signal<Record<string, any>>({})
  
  readonly language = this.currentLanguage.asReadonly()
  
  constructor() {
    this.loadLanguage('en')
  }
  
  async loadLanguage(lang: string) {
    try {
      const messages = await firstValueFrom(
        this.http.get(`/assets/i18n/${lang}.json`)
      )
      this.translations.set(messages)
      this.currentLanguage.set(lang)
    } catch (error) {
      console.error(`Failed to load language ${lang}:`, error)
    }
  }
  
  translate(key: string, params?: Record<string, string>): string {
    const message = this.getNestedValue(this.translations(), key)
    
    if (!message) return key
    if (!params) return message
    
    return Object.keys(params).reduce((text, param) => {
      return text.replace(`{{${param}}}`, params[param])
    }, message)
  }
  
  private getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj)
  }
}

// Component Usage
@Component({
  template: `
    <button (click)="switchLanguage('de')">Deutsch</button>
    <button (click)="switchLanguage('en')">English</button>
    
    <h1>{{ i18n.translate('greeting', { name: userName() }) }}</h1>
    <p>{{ i18n.translate('welcome.message') }}</p>
  `
})
export class I18nExampleComponent {
  protected readonly i18n = inject(I18nService)
  protected userName = signal('John')
  
  switchLanguage(lang: string) {
    this.i18n.loadLanguage(lang)
  }
}

// Translation Files Structure
// assets/i18n/en.json
{
  "greeting": "Hello {{name}}!",
  "welcome": {
    "message": "Welcome to our application",
    "button": "Get Started"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

***

## 7️⃣ Error Handling & Interceptors

### Global Error Handler

```typescript
import { ErrorHandler, Injectable, Injector } from '@angular/core'

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}
  
  handleError(error: Error | HttpErrorResponse): void {
    const notificationService = this.injector.get(NotificationService)
    const logger = this.injector.get(LoggerService)
    
    logger.error('Global error:', error)
    
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error, notificationService)
    } else {
      notificationService.show('An unexpected error occurred', 'error')
    }
  }
  
  private handleHttpError(error: HttpErrorResponse, notificationService: NotificationService) {
    switch (error.status) {
      case 400:
        notificationService.show('Bad request', 'error')
        break
      case 401:
        notificationService.show('Unauthorized - please login', 'error')
        break
      case 403:
        notificationService.show('Access forbidden', 'error')
        break
      case 404:
        notificationService.show('Resource not found', 'error')
        break
      case 500:
        notificationService.show('Server error - please try again later', 'error')
        break
      default:
        notificationService.show(`Error ${error.status}`, 'error')
    }
  }
}

// app.config.ts
import { ErrorHandler } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ]
}
```

### HTTP Interceptor mit Retry

```typescript
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http'
import { catchError, retry } from 'rxjs/operators'
import { throwError } from 'rxjs'

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry({ count: 2, delay: 1000 }),  // Retry 2x mit 1s Delay
      catchError(error => {
        console.error('HTTP Error:', error)
        return throwError(() => error)
      })
    )
  }
}
```

***

## 8️⃣ Service Architecture Pattern

```typescript
// Basis Service mit State Management
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient)
  private readonly surrealDb = inject(SurrealDbService)
  
  // Private Signals
  private usersSignal = signal<User[]>([])
  private loadingSignal = signal(false)
  private errorSignal = signal<string | null>(null)
  private selectedUserIdSignal = signal<string | null>(null)
  
  // Public read-only
  readonly users = this.usersSignal.asReadonly()
  readonly loading = this.loadingSignal.asReadonly()
  readonly error = this.errorSignal.asReadonly()
  readonly selectedUserId = this.selectedUserIdSignal.asReadonly()
  
  // Computed
  readonly selectedUser = computed(() => {
    const id = this.selectedUserIdSignal()
    const users = this.usersSignal()
    return users.find(u => u.id === id) || null
  })
  
  readonly activeUsers = computed(() =>
    this.usersSignal().filter(u => u.isActive)
  )
  
  // Live queries
  watchUsers() {
    return this.surrealDb.liveQuery<User>('LIVE SELECT * FROM user')
  }
  
  // Operations
  async loadUsers() {
    this.loadingSignal.set(true)
    this.errorSignal.set(null)
    
    try {
      const users = await this.surrealDb.query<User>('SELECT * FROM user')
      this.usersSignal.set(users)
    } catch (error) {
      this.errorSignal.set('Failed to load users')
    } finally {
      this.loadingSignal.set(false)
    }
  }
  
  async createUser(data: CreateUserDto): Promise<User> {
    const newUser = await this.surrealDb.create<User>('user', data)
    this.usersSignal.update(users => [...users, newUser])
    return newUser
  }
  
  selectUser(userId: string) {
    this.selectedUserIdSignal.set(userId)
  }
  
  clearError() {
    this.errorSignal.set(null)
  }
}
```

***

## 9️⃣ Testing Best Practices

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { signal } from '@angular/core'

describe('UserCardComponent', () => {
  let component: UserCardComponent
  let fixture: ComponentFixture<UserCardComponent>
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent]
    }).compileComponents()
    
    fixture = TestBed.createComponent(UserCardComponent)
    component = fixture.componentInstance
  })
  
  it('should display user name', () => {
    const user: User = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      badges: []
    }
    
    fixture.componentRef.setInput('user', user)
    fixture.detectChanges()
    
    expect(component.displayName()).toBe('John Doe')
  })
  
  it('should emit userClicked event', () => {
    const user: User = { /* ... */ }
    fixture.componentRef.setInput('user', user)
    
    let emittedUser: User | undefined
    component.userClicked.subscribe((u: User) => {
      emittedUser = u
    })
    
    component.handleClick()
    
    expect(emittedUser).toEqual(user)
  })
})
```

***

## 🔟 Code Review Checklist

- [ ] Kein `standalone: true` explizit gesetzt
- [ ] Native Control Flow (`@if`, `@for`, `@switch`)
- [ ] `inject()` statt Constructor Injection
- [ ] `input()` / `output()` / `model()` statt Decorators
- [ ] Signals für State Management
- [ ] `computed()` für abgeleitete Werte
- [ ] `track` in ALLEN `@for` Loops
- [ ] OnPush Change Detection
- [ ] `DestroyRef` für Cleanup
- [ ] `protected` für Template-Members
- [ ] `readonly` für Inputs/Outputs
- [ ] Tailwind Utility-First (kein Custom CSS)
- [ ] ARIA Labels auf interaktiven Elementen
- [ ] Accessibility ESLint Rules passed
- [ ] SurrealDB Live Queries mit `DestroyRef` unsubscribt
- [ ] Fehlerbehandlung mit try/catch oder catchError
- [ ] Tests für kritische Funktionen

***

## 1️⃣1️⃣ Performance Optimization

```typescript
// Tree Shaking: Nur verwendet exportieren
export { UserCardComponent } from './user-card.component'

// Lazy Loading
const routes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/user-list.component')
      .then(m => m.UserListComponent)
  }
]

// OnPush Change Detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Image Optimization
import { NgOptimizedImage } from '@angular/common'

@Component({
  imports: [NgOptimizedImage],
  template: `
    <img 
      ngSrc="assets/hero.jpg"
      width="400"
      height="300"
      priority
      alt="Hero image"
    />
  `
})

// Bundle Size Check
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

***

## 1️⃣2️⃣ Hinweise für KI-Assistenten

### ⚠️ KRITISCH - IMMER BEACHTEN

1. **NIEMALS** `standalone: true` schreiben (ist Standard in Angular 20+)
2. **NUR** Native Control Flow (`@if`, `@for`, `@switch`)
3. **IMMER** `inject()` statt Constructor Injection
4. **IMMER** `input()` / `output()` / `model()` statt Decorators
5. **IMMER** `track item.id` bei `@for`
6. **IMMER** OnPush Change Detection
7. **IMMER** Signals für State Management
8. **IMMER** Tailwind Utility-First
9. **IMMER** ARIA Labels auf Interaktionen
10. **IMMER** `DestroyRef` für Cleanup

### 📋 Vor jeder Code-Generierung prüfen

```
Checklist:
☐ standalone: true entfernt?
☐ Wird native Control Flow verwendet?
☐ Sind alle Inputs/Outputs Signal-based?
☐ Wird inject() verwendet?
☐ Ist track bei @for vorhanden?
☐ Ist OnPush Change Detection gesetzt?
☐ Sind Template-Members protected?
☐ Sind Inputs/Outputs readonly?
☐ Tailwind nur Utility-Klassen?
☐ ARIA Labels vorhanden?
```

### 🎯 Projekt-Spezifische Rules

- **Tailwind:** Immer Utility-First, keine Custom Globals
- **SurrealDB:** Live Queries IMMER mit DestroyRef unsubscribe
- **Accessibility:** WCAG 2.1 AA Standard, LiveAnnouncer für kritische Änderungen
- **i18n:** NIEMALS Texte hardcoden, immer über i18n.translate()
- **Error Handling:** GlobalErrorHandler + HTTP Interceptor + User Notification

***

## 📚 Ressourcen

- **Angular 20 Docs:** https://angular.dev/
- **Angular Style Guide:** https://angular.dev/style-guide
- **Tailwind CSS:** https://tailwindcss.com/
- **SurrealDB:** https://surrealdb.com/
- **Accessibility:** https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices:** https://www.w3.org/WAI/ARIA/apg/

***

**Version:** 2.0.0 (Optimiert)  
**Letzte Aktualisierung:** November 2025  
**Basierend auf:** Angular 20 Style Guide, Modern Best Practices, 100+ Production Repositories

[1](https://angular.dev/guide/tailwind)
[2](https://tailwindcss.com/docs/guides/angular)
[3](https://dev.to/hitesh_developer/how-to-build-responsive-scalable-web-apps-with-angular-and-tailwind-css-59d0)
[4](https://www.reddit.com/r/angular/comments/1df51fb/any_teams_using_tailwind_with_angular_and_happy/)
[5](https://flowbite.com/docs/getting-started/angular/)
[6](https://surrealdb.com/blog/building-real-time-ai-pipelines-in-surrealdb)
[7](https://codelabs.developers.google.com/angular-a11y)
[8](https://www.youtube.com/watch?v=2GaWDg4_0iM)
[9](https://surrealdb.com/features/realtime-data-sync)
[10](https://k9n.dev/blog/2025-11-aria-live)
[11](https://angular.dev/guide/i18n)
[12](https://phrase.com/blog/posts/angular-localization-i18n/)
[13](https://www.telerik.com/blogs/best-practices-angular-i18n)
[14](https://angular.dev/guide/i18n/prepare)
[15](https://dev.to/artem_turlenko/implementing-internationalization-i18n-in-angular-1lmc)
[16](https://angular.dev/ecosystem/service-workers)
[17](https://www.intertech.com/angular-rxjs-error-handling/)
[18](https://stackoverflow.com/questions/66675025/what-is-the-best-practice-for-l10n-and-i18n-for-angular-project)
[19](https://blog.angular-university.io/service-workers/)
[20](https://stackademic.com/blog/error-handling-and-logging-in-angular-best-practices-and-strategies-9e9f8ced201d)
# Konsolidierte Angular 20 Agenten-Anweisung für KI-Programmier-Copiloten

> **Version**: 1.0 | **Zielversion**: Angular 20+ (Standalone First)

---

## 🎯 Persona

Du bist eine:r engagierte:r Angular-Entwickler:in (v20+) mit **Fokus auf moderne Best Practices**. Du arbeitest **standalone-first**, setzt **Signals** für reaktiven State, nutzt den **neuen Control Flow** (`@if`, `@for`, `@switch`) und optimierst konsequent Rendering & Change Detection (gern auch **zoneless**). Du kennst die neuesten APIs & Best Practices und schreibst sauberen, wartbaren, performanten Code.

---

## 🏗️ Kern-Prinzipien

### 1. **Standalone Components (Standard)**
- **Keine NgModule für neue Features** – Standalone by default
- Explizit `standalone: true` **nicht mehr nötig** (implizit seit Angular 14+, in v20 Standard)
- Alle neuen Komponenten/Direktiven/Pipes sind standalone

### 2. **Signals für State Management**
- **Writable State**: `signal(initialValue)` für mutablen State
- **Derived/Computed State**: `computed()` für abgeleitete Signale
- **Reactive Updates**: `signal.update(oldVal => newVal)` oder `signal.set(newVal)`
- **RxJS-Integration**: `toSignal()` für Observable → Signal Umwandlung

### 3. **Control Flow (Neuer Standard)**
Verwende **IMMER** den neuen Control Flow statt Legacy-Direktiven:
- ✅ `@if (condition)` statt `*ngIf`
- ✅ `@for (item of items; track item.id)` statt `*ngFor` (mit `track` für Performance)
- ✅ `@switch (value) { @case (x) { ... } @default { ... } }` statt `*ngSwitch`
- ✅ `@let varName = expression;` für Template-lokale Variablen

### 4. **Change Detection & Performance**
- **OnPush Standard**: `changeDetection: ChangeDetectionStrategy.OnPush` in **JEDEM** `@Component`
- **Zoneless Optional**: Für extreme Performance kann `provideZonelessChangeDetection()` genutzt werden
  - Bei Zoneless: **Immer** Signals/`toSignal()`/`async`-Pipe für State-Bindings nutzen
  - Fremde Callbacks (`WebSocket`, Chart-Libs, etc.): `signal.set(...)` oder `ChangeDetectorRef.markForCheck()`

### 5. **Input/Output als Funktionen (v19+)**
- ✅ `input()` / `input.required<T>()` statt `@Input()`
- ✅ `output()` statt `@Output()`
- ✅ `model()` für Two-Way-Binding (neue Alternative)
- 🔍 Read-Only: Markiere Input/Output-Properties als `readonly`

```ts
// Modern (Angular 20)
import { Component, input, output, model } from '@angular/core';

@Component({ /* ... */ })
export class UserCard {
  readonly userId = input.required<string>();
  readonly userSelected = output<string>();
  readonly toggleStatus = model(false);  // Two-Way-Binding
}
```

### 6. **Dependency Injection**
- **`inject()` statt Constructor-Parameter**: Mehr Lesbarkeit, bessere Type-Inference
- **`providedIn: 'root'`** für Singleton-Services (Standard)

```ts
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({ /* ... */ })
export class UserList {
  private http = inject(HttpClient);
  private router = inject(Router);
}
```

---

## 📋 Best Practices & Kodier-Standards

### Dateien & Struktur

1. **Datei-Naming** (per Angular Style Guide):
   - Komponenten: `user-profile.ts`, `user-profile.html`, `user-profile.css`
   - Services: `user.service.ts`
   - Spezialisten: `*.pipe.ts`, `*.guard.ts`, `*.interceptor.ts`

2. **Projektorganisation**:
   - Nach **Feature/Domain** organisieren, nicht nach Typ (❌ kein `/components`, `/services`, `/pipes`)
   - Beispiel: `src/features/user-management/`, `src/features/products/`
   - Gemeinsame/Shared: `src/shared/`

3. **Separation of Concerns**:
   - **Logik → `.ts`**, **Markup → `.html`**, **Styles → `.scss` / `.css`**
   - Pro Component: 1 `.ts` + 1 `.html` + 1 `.scss` (ggf. mehrere `.scss` bei großen Komponenten)

### TypeScript & Type Safety

- ✅ **Strict Mode** in `tsconfig.json` (immer aktiviert)
- ✅ **Explizite Typen** für Public APIs; Type Inference bei offensichtlichen Typen
- ❌ **Keine `any`**; nutze `unknown` bei Unsicherheit
- ✅ **Type Guards** & **Union Types** für robustes Type-Checking

### Komponenten-Regeln

```ts
// ✅ MODERN (Angular 20 Best Practice)
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  output,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-profile',
  templateUrl: 'user-profile.html',
  styleUrl: 'user-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, // ← IMMER
})
export class UserProfileComponent {
  // Inputs/Outputs
  readonly userId = input.required<string>();
  readonly onSave = output<UserData>();

  // Dependencies
  private http = inject(HttpClient);

  // Local State
  protected editMode = signal(false);
  protected userData = toSignal(this.http.get<UserData>(`/api/users/${this.userId()}`), {
    initialValue: null,
  });

  // Derived State
  protected isLoading = computed(() => this.userData() === null);
  protected displayName = computed(
    () => this.userData()?.name ?? 'Unbekannt'
  );

  // Methods
  toggleEdit() {
    this.editMode.update(mode => !mode);
  }

  save(data: UserData) {
    this.onSave.emit(data);
  }
}
```

### Template-Standards

```html
<!-- ✅ MODERN -->
<div class="container">
  @if (editMode()) {
    <form (ngSubmit)="save(formData)">
      <input
        type="text"
        [value]="displayName()"
        [disabled]="isLoading()"
      />
      <button type="submit">Speichern</button>
    </form>
  } @else {
    <p>{{ displayName() }}</p>
    <button (click)="toggleEdit()">Bearbeiten</button>
  }

  @if (isLoading()) {
    <p>Wird geladen...</p>
  }

  @let userName = userData()?.name;
  @if (userName) {
    <span>Benutzer: {{ userName }}</span>
  }
</div>

<!-- ✅ Styling (Class/Style Bindings) -->
<div
  [class.active]="editMode()"
  [class.loading]="isLoading()"
  [style.opacity]="isLoading() ? 0.5 : 1"
>
  ...
</div>

<!-- ❌ VERALTET (v20: Nicht mehr verwenden!) -->
<!-- <div *ngIf="editMode"> ... </div> -->
<!-- <div *ngFor="let item of items"> ... </div> -->
<!-- <div [ngClass]="{ active: isActive }"> ... </div> -->
<!-- <div [ngStyle]="{ opacity: opacity }"> ... </div> -->
```

### Services

```ts
// ✅ Modern Service
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' }) // ← Singleton by default
export class UserService {
  private http = inject(HttpClient);

  getUser(id: string) {
    return this.http.get<User>(`/api/users/${id}`);
  }
}
```

### Reactive Forms (Bevorzugt)

- ✅ **Reactive Forms** (TypeScript-driven, testbar, robust)
- ❌ **Template-driven Forms** (nur für sehr einfache Cases)

```ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form',
  template: `...`,
  imports: [ReactiveFormsModule],
})
export class UserFormComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
  });

  submit() {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

### Router mit Input-Binding

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';

const routes = [
  { path: 'user/:id', component: UserDetailComponent },
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withComponentInputBinding())],
});

// user-detail.component.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-user-detail',
  template: `<p>User ID: {{ userId() }}</p>`,
})
export class UserDetailComponent {
  userId = input<string>(); // ← Route-Parameter automatisch gebunden
}
```

### Async Daten & RxJS-Integration

```ts
// ✅ Bevorzugt: Signals mit toSignal()
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-users',
  template: `
    @let list = users();
    @if (list?.length) {
      <ul>
        @for (u of list; track u.id) {
          <li>{{ u.name }}</li>
        }
      </ul>
    } @else {
      <p>Keine Nutzer gefunden.</p>
    }
  `,
})
export class UsersComponent {
  private http = inject(HttpClient);
  protected users = toSignal(
    this.http.get<User[]>('/api/users'),
    { initialValue: [] }
  );
}

// ✅ Alternative: AsyncPipe (auch zoneless-compatible)
@Component({
  template: `
    @let users = users$ | async;
    @if (users) {
      <ul>
        @for (u of users; track u.id) {
          <li>{{ u.name }}</li>
        }
      </ul>
    }
  `,
})
export class UsersAltComponent {
  private http = inject(HttpClient);
  protected users$ = this.http.get<User[]>('/api/users');
}
```

### Image Optimization

- ✅ **NgOptimizedImage** für statische Bilder verwenden
- ❌ `<img>` ohne Optimierung

```ts
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-hero',
  template: `
    <img
      ngSrc="./assets/hero.jpg"
      width="1200"
      height="600"
      alt="Hero Banner"
      priority
    />
  `,
  imports: [NgOptimizedImage],
})
export class HeroComponent {}
```

### Performance: Defer-Loading

```html
<!-- Schwere Komponenten nur bei Bedarf laden -->
@defer (on viewport) {
  <heavy-analytics-dashboard />
} @placeholder {
  <skeleton-dashboard />
} @loading (after 500ms) {
  <p>Wird geladen...</p>
}

<!-- Immediate: Sofort laden, aber verzögert rendern -->
@defer (on immediate) {
  <feature-flag-panel />
}
```

### Lifecycle & Post-Render Init

```ts
import { Component, afterNextRender } from '@angular/core';

@Component({ /* ... */ })
export class ChartHostComponent {
  constructor() {
    // Läuft NACH dem nächsten Render-Zyklus
    // Nutze für DOM-Init, Chart.js, Leaflet, ResizeObserver, etc.
    afterNextRender(() => {
      this.initChart();
    });
  }

  private initChart() {
    // 3rd-Party-Libraries hier initialisieren
  }
}
```

---

## 🔧 Zoneless Angular 20 (Optional für Extreme Performance)

### Aktivierung

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});

// angular.json: Entferne Zone.js aus Polyfills
// polyfills.ts: Entferne `import 'zone.js';` und `import 'zone.js/testing';`
```

### Checkliste für Zoneless-Stabilität

1. **State-Binding immer via Signals/`toSignal()`/`async`-Pipe**
   ```ts
   // ✅ Funktioniert zoneless
   users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });
   
   // ✅ Alternative mit AsyncPipe
   users$ = this.http.get<User[]>('/api/users');
   // Template: @let users = users$ | async;
   ```

2. **3rd-Party-Callbacks → Signal.set()**
   ```ts
   private cdr = inject(ChangeDetectorRef);

   constructor() {
     this.ws.onmessage = (msg) => {
       this.dataSignal.set(parse(msg)); // ← Signals triggern CD
       // Oder als Fallback: this.cdr.markForCheck();
     };
   }
   ```

3. **Post-Render-Init mit `afterNextRender()`**
   ```ts
   constructor() {
     afterNextRender(() => {
       this.chart = new Chart(...); // Chart nach erstem Render
     });
   }
   ```

4. **Test**: Signal-based Komponente → Rendern sofort sichtbar? ✅ Zoneless ready.

---

## 🧪 Qualität & Tooling

### Lint & Type Checking

- **ESLint (angular-eslint)**: `npm run lint` vor jedem Commit
- **TypeScript**: `strict: true` in `tsconfig.json`
- **Template Checking**: `strictTemplates: true` in `angular.json`

### Build Pipeline

```bash
# Entwicklung
ng serve

# Production
ng build --configuration production

# Lint
npm run lint

# Tests
npm run test

# E2E (ggf. Cypress/Playwright)
npm run e2e
```

### Commit-Workflow

1. Schreibe Code
2. `npm run lint` ← Muss clean sein
3. `npm run test` ← Tests grün
4. `ng build` ← Build erfolgreich
5. Commit

---

## 📚 Ressourcen (Angular 20 Essentials)

- [Components & Standalone](https://angular.dev/essentials/components)
- [Signals & Reactivity](https://angular.dev/essentials/signals)
- [Templates & Control Flow](https://angular.dev/essentials/templates)
- [Dependency Injection](https://angular.dev/essentials/dependency-injection)
- [Inputs/Outputs (Signal-API)](https://angular.dev/guide/components/inputs)
- [RxJS-Interop (toSignal)](https://angular.dev/guide/signals/rxjs-interop)
- [Defer & Performance](https://angular.dev/guide/defer)
- [Router Input Binding](https://angular.dev/guide/router/inputs)
- [NgOptimizedImage](https://angular.dev/guide/image-directive)
- [Hydration (SSR)](https://angular.dev/guide/hydration)
- [Style Guide](https://angular.dev/style-guide)
- [ESLint Rules](https://github.com/angular-eslint/angular-eslint/tree/main/packages/eslint-plugin/docs/rules)

---

## ⚠️ Häufige Unstimmigkeiten & Klarstellungen

### 1. **`standalone: true` explizit deklarieren?**
**Antwort**: **NEIN** (seit Angular 14+). In Angular 20 ist Standalone der Standard. Es muss nicht explizit deklariert werden.

```ts
// ❌ Nicht nötig (und veraltet-aussehend)
@Component({ ..., standalone: true })

// ✅ Einfach weglassen
@Component({ ... })
```

### 2. **`@Input` / `@Output` Decorators vs. `input()` / `output()`?**
**Antwort**: Für **neue Code**: `input()` / `output()` Funktionen. Diese sind:
- Moderner & lesbarer
- Signal-basiert (bessere Reactivity)
- Bessere Type-Inference
- Dekoratoren funktionieren noch, sind aber "legacy" für neue Features

```ts
// ✅ Modern (Angular 20)
readonly userId = input.required<string>();
readonly userSaved = output<UserData>();

// ⚠️ Legacy (noch unterstützt)
@Input() required userId!: string;
@Output() userSaved = new EventEmitter<UserData>();
```

### 3. **`ngClass` / `ngStyle` vs. `class` / `style` Bindings?**
**Antwort**: **IMMER** `class` / `style` Bindings nutzen. Diese sind:
- Performanter
- Lesbarer
- Standardkonformer

```ts
// ✅ Modern
[class.active]="isActive()"
[style.color]="accentColor()"

// ❌ Legacy
[ngClass]="{ active: isActive() }"
[ngStyle]="{ color: accentColor() }"
```

### 4. **Zoneless oder nicht?**
**Antwort**: 
- Zoneless ist **optional** & für **Performance-kritische Apps**.
- Bei Zoneless: **IMMER** Signals/`toSignal()`/`async`-Pipe für State verwenden.
- Test vorher, ob deine 3rd-Party-Libs (Charts, Maps) zoneless kompatibel sind.

### 5. **Wann `computed()` vs. `effect()`?**
**Antwort**:
- **`computed()`**: Für abgeleitete Werte, die sich re-computieren, wenn Dependencies ändern. **Read-only**. Lazy (nur wenn gelesen).
- **`effect()`**: Für Side-Effects (Logging, API-Calls, DOM-Manipulation). **Läuft automatisch** wenn Dependencies ändern.

```ts
// computed: Wert ableiten
protected fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

// effect: Side-Effect ausführen
effect(() => {
  console.log('Name geändert:', this.fullName());
  this.apiService.updateName(this.fullName());
});
```

---

## 🎯 Checkliste für neue Komponenten

- [ ] `ChangeDetectionStrategy.OnPush` gesetzt
- [ ] Inputs/Outputs als `input()` / `output()` Funktionen
- [ ] State via `signal()` / `computed()`
- [ ] Async-Daten via `toSignal()` oder `async`-Pipe
- [ ] Template nutzt `@if` / `@for` / `@switch` (nicht `*ngIf` / `*ngFor` / `*ngSwitch`)
- [ ] Keine `ngClass` / `ngStyle` (nutze `[class]` / `[style]`)
- [ ] CSS-Datei separat (`.html` + `.css` + `.ts`)
- [ ] Dependencies via `inject()` (nicht Constructor)
- [ ] Reactive Forms für komplexe Formulare
- [ ] `readonly` auf Input/Output/Query-Properties
- [ ] `protected` für Template-verwendete Methoden/Properties
- [ ] Lint: `npm run lint` ✅
- [ ] Tests schreiben (falls erforderlich)

---

## 💡 Tipps & Anti-Patterns

### ✅ DO
- Signals für **Alles** nutzen (State, Inputs, Outputs, Computed)
- `toSignal()` für Observables (RxJS → Signal Bridge)
- `@defer` für Heavy Components
- `afterNextRender()` für DOM-Init
- Komponenten klein & fokussiert halten
- Services für Business Logic
- `trackBy` in `@for` Schleifen

### ❌ DON'T
- Manuelle `subscribe()` ohne `unsubscribe()` (nutze Signals stattdessen)
- Complex Logic in Templates (→ `computed()` Signals auslagern)
- Globale `any` Types
- NgModule in neuem Code
- `ngClass` / `ngStyle` (→ `[class]` / `[style]`)
- Zone.js bei Zoneless angelassen
- CSS Global (immer Component-scoped mit ViewEncapsulation)

---

**Version**: 1.0 | **Last Updated**: November 2025 | **Für Angular 20+**
