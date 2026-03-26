# Review Checklists

## JavaScript / TypeScript

### Correctness
- [ ] No `any` types (use `unknown` if type is genuinely unknown)
- [ ] Async functions properly awaited at all call sites
- [ ] Optional chaining used where nullability is possible
- [ ] Array methods return values used (`.map()` not used for side effects)
- [ ] `===` used instead of `==` (no implicit coercion)
- [ ] Error objects thrown, not strings
- [ ] Promise rejection handled (`.catch()` or try/catch with await)

### Security
- [ ] No `eval()`, `new Function()`, or `innerHTML` with user input
- [ ] URL parameters validated before use
- [ ] JSON.parse wrapped in try/catch
- [ ] No secrets in client-side code
- [ ] CORS configured for specific origins, not `*` in production
- [ ] Content-Security-Policy headers set

### Performance
- [ ] No synchronous operations in hot paths
- [ ] Large arrays: avoid `.filter().map()` chains (combine into single pass)
- [ ] Debounce/throttle on frequent events (scroll, resize, input)
- [ ] Lazy load below-fold content
- [ ] Tree-shakeable imports (named imports, not `import *`)

### React-Specific
- [ ] useEffect cleanup functions provided
- [ ] Dependency arrays complete and correct
- [ ] Keys on list items are stable and unique (not array index for dynamic lists)
- [ ] No state updates during render
- [ ] Expensive computations wrapped in useMemo with correct deps
- [ ] Event handlers wrapped in useCallback when passed as props

## Python

### Correctness
- [ ] No mutable default arguments
- [ ] Context managers used for resources (`with` statement)
- [ ] Exception handling catches specific exceptions, not bare `except:`
- [ ] f-strings or `.format()` used, not `%` formatting
- [ ] Type hints on function signatures

### Security
- [ ] No `pickle` with untrusted data
- [ ] No `os.system()` or `subprocess.shell=True` with user input
- [ ] SQL queries use parameterized statements
- [ ] File paths validated, no directory traversal possible

### Performance
- [ ] Generators used for large sequences (`yield` over list accumulation)
- [ ] `set` used for membership tests over `list`
- [ ] Database connections pooled
- [ ] No repeated computation in loops (hoist invariants)

## Go

### Correctness
- [ ] All errors checked (no `_` for error returns in production)
- [ ] Goroutine leaks prevented (context cancellation, done channels)
- [ ] Defer used for cleanup, understanding LIFO order
- [ ] Nil pointer checks before dereference
- [ ] Map access uses comma-ok pattern

### Security
- [ ] `html/template` used for HTML output, not `text/template`
- [ ] `crypto/rand` used, not `math/rand` for security-sensitive values
- [ ] HTTP client has timeout set
- [ ] No unsanitized user input in SQL, commands, or file paths

## Rust

### Correctness
- [ ] `unwrap()` not used in production code (use `?` or explicit handling)
- [ ] Ownership model respected (no unnecessary cloning)
- [ ] Lifetimes explicit where compiler requires
- [ ] Pattern matching exhaustive

### Performance
- [ ] `&str` preferred over `String` for read-only access
- [ ] `Vec` pre-allocated when size is known (`Vec::with_capacity`)
- [ ] Iterators used over manual indexing
