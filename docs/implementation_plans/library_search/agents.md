# Library search in the app (v1.4.0)

## Task
Move app search to `GET /v1/search`, add search history settings and the My books counts.

## Purpose
One search for the website, the app and assistants, with the same answers everywhere.

## Phases
1. Hooks (`hooks/useSearch.ts`) on the typed client. Acceptance: no call to the retired `/search`.
2. Search modal: Books and In pages tabs, paging to 200, hint when empty. Acceptance: "داستان" finds Arabian Nights pages; "dastan" shows the Urdu script hint.
3. Settings card: history switch (off by default), list, delete one, delete all; turning off asks, delete is the default.
4. Library tab counts from `GET /v1/me/library`.

## Assumptions
- Book and reader screens still use the retired API, so results open on ilm.red in the in-app browser for now.
- The contract lives in ilm-red-unbound (`openapi/books.yaml`, `openapi/me.yaml`); the client is synced, never edited here.

## Testing criteria
- `tsc --noEmit` has no errors in the changed files.
- Manual checks listed in the CHANGELOG entry.
