# Recall Flashcards

A responsive, single-page flashcard app built with plain HTML, CSS, and JavaScript. No build step or dependencies are required.

## Run locally

Open `index.html` in a modern browser. Decks, cards, and the last active deck are saved in that browser's LocalStorage.

## Features

- Create, rename, and delete decks.
- Add, edit, and delete cards with a front and back.
- Search the current deck by text on either side of a card.
- Study with flip, previous/next, shuffle, and keyboard controls.
- Responsive layout, visible focus states, labeled controls, and screen-reader announcements.

## Reflection

- AI saved time by generating the initial semantic page structure, responsive visual system, and the basic CRUD and study interactions in plain JavaScript.
- I found and fixed an AI-generated interaction bug: one confirmation combined deck editing and deletion, so pressing Cancel unexpectedly deleted the deck. Separate, clearly named Edit and Delete menu actions fixed the ambiguity.
- I refactored form validation around the active form type instead of validating hidden fields too. The shared logic is now easier to read and keeps blank or whitespace-only input out of saved data:

  ```js
  const fieldsToCheck = dialogMode === "new-deck" || dialogMode === "edit-deck"
    ? [elements.itemName]
    : [elements.itemFront, elements.itemBack];
  const blankField = fieldsToCheck.find((field) => !field.value.trim());
  ```

- I improved accessibility by using the browser's native modal dialog behavior for keyboard focus containment, returning focus to the opener (or a useful fallback), and adding explicit labels, live announcements, and keyboard study controls.
- More specific prompts improved the result: naming the exact interaction states, keyboard behavior, responsive constraints, and quality checks produced more consistent UI and made it easier to find edge cases than asking for a generic flashcards app.

## Repository

This workspace has not been connected to a GitHub repository yet. Add the published repository URL here after creating or connecting one.
