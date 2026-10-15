(() => {
  const STORAGE_KEY = "recall-flashcards-v1";
  const starterDecks = [
    {
      id: "getting-started",
      name: "Getting started",
      cards: [
        { id: "active-recall", front: "What is active recall?", back: "A study technique where you retrieve information from memory instead of simply rereading it." },
        { id: "spaced-practice", front: "Why space out your practice?", back: "Reviewing over time helps strengthen memories and makes them easier to retrieve later." },
        { id: "small-steps", front: "What makes a useful flashcard?", back: "One clear prompt with a concise answer. Keep each card focused on a single idea." },
      ],
    },
  ];

  const elements = {
    deckList: document.querySelector("#deck-list"),
    deckTotal: document.querySelector("#deck-total"),
    deckTitle: document.querySelector("#deck-title"),
    deckDescription: document.querySelector("#deck-description"),
    deckOptions: document.querySelector("#deck-options"),
    deckMenu: document.querySelector("#deck-menu"),
    deckActionsMenu: document.querySelector("#deck-actions-menu"),
    deckToolbar: document.querySelector("#deck-toolbar"),
    cardCount: document.querySelector("#card-count"),
    searchCount: document.querySelector("#search-count"),
    cardsSection: document.querySelector("#cards-section"),
    cardSearch: document.querySelector("#card-search"),
    cardList: document.querySelector("#card-list"),
    emptyState: document.querySelector("#empty-state"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyDescription: document.querySelector("#empty-description"),
    emptyAction: document.querySelector("#empty-action"),
    deckView: document.querySelector("#deck-view"),
    studyView: document.querySelector("#study-view"),
    studyDeckName: document.querySelector("#study-deck-name"),
    studyProgressLabel: document.querySelector("#study-progress-label"),
    studyProgressPercent: document.querySelector("#study-progress-percent"),
    progressTrack: document.querySelector(".progress-track"),
    progressFill: document.querySelector("#progress-fill"),
    flashcard: document.querySelector("#flashcard"),
    flashcardFrontSide: document.querySelector("#flashcard-front-side"),
    flashcardFrontText: document.querySelector("#flashcard-front-text"),
    flashcardBackSide: document.querySelector("#flashcard-back-side"),
    flashcardBackText: document.querySelector("#flashcard-back-text"),
    flashcardFront: document.querySelector("#flashcard-front"),
    flashcardBack: document.querySelector("#flashcard-back"),
    dialog: document.querySelector("#form-dialog"),
    form: document.querySelector("#item-form"),
    dialogTitle: document.querySelector("#dialog-title"),
    dialogEyebrow: document.querySelector("#dialog-eyebrow"),
    itemName: document.querySelector("#item-name"),
    itemFront: document.querySelector("#item-front"),
    itemBack: document.querySelector("#item-back"),
    nameField: document.querySelector("#name-field"),
    frontField: document.querySelector("#front-field"),
    backField: document.querySelector("#back-field"),
    saveItem: document.querySelector("#save-item"),
    liveRegion: document.querySelector("#live-region"),
    mainContent: document.querySelector("#main-content"),
  };

  function readState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { decks: starterDecks, activeDeckId: starterDecks[0].id };
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.decks)) throw new Error("Stored flashcard data is invalid.");
      return {
        decks: parsed.decks.filter((deck) =>
          deck && typeof deck.id === "string" && typeof deck.name === "string" && Array.isArray(deck.cards)
        ),
        activeDeckId: typeof parsed.activeDeckId === "string" ? parsed.activeDeckId : null,
      };
    } catch (error) {
      console.error("Could not load saved flashcards:", error);
      return { decks: starterDecks, activeDeckId: starterDecks[0].id };
    }
  }

  const state = readState();
  let currentView = "deck";
  let dialogMode = null;
  let editingId = null;
  let studyCardIds = [];
  let studyIndex = 0;
  let isFlipped = false;
  let dialogOpener = null;

  if (!state.decks.some((deck) => deck.id === state.activeDeckId)) {
    state.activeDeckId = state.decks[0]?.id ?? null;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ decks: state.decks, activeDeckId: state.activeDeckId }));
    } catch (error) {
      console.error("Could not save flashcards:", error);
      announce("Your changes could not be saved in this browser.");
    }
  }

  function makeId() {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function activeDeck() {
    return state.decks.find((deck) => deck.id === state.activeDeckId) ?? null;
  }

  function announce(message) {
    elements.liveRegion.textContent = "";
    window.setTimeout(() => {
      elements.liveRegion.textContent = message;
    }, 20);
  }

  function makeButton(className, label, text, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }

  function renderDeckList() {
    elements.deckList.replaceChildren();
    elements.deckTotal.textContent = String(state.decks.length).padStart(2, "0");
    state.decks.forEach((deck) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `deck-link${deck.id === state.activeDeckId ? " is-active" : ""}`;
      button.setAttribute("aria-current", deck.id === state.activeDeckId ? "page" : "false");
      const icon = document.createElement("span");
      icon.className = "deck-link-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "▤";
      const name = document.createElement("span");
      name.className = "deck-link-name";
      name.textContent = deck.name;
      const count = document.createElement("span");
      count.className = "deck-link-count";
      count.textContent = String(deck.cards.length);
      button.append(icon, name, count);
      button.addEventListener("click", () => selectDeck(deck.id));
      elements.deckList.append(button);
    });
  }

  function renderCards() {
    const deck = activeDeck();
    elements.cardList.replaceChildren();
    if (!deck) return;
    const term = elements.cardSearch.value.trim().toLocaleLowerCase();
    const matchingCards = deck.cards.filter((card) =>
      `${card.front} ${card.back}`.toLocaleLowerCase().includes(term)
    );
    elements.searchCount.textContent = term
      ? `Showing ${matchingCards.length} of ${deck.cards.length} cards`
      : `${deck.cards.length} ${deck.cards.length === 1 ? "card" : "cards"}`;

    if (matchingCards.length === 0) {
      const message = document.createElement("p");
      message.className = "no-results";
      message.textContent = term ? "No cards match your search." : "There are no cards in this deck yet.";
      elements.cardList.append(message);
      return;
    }

    matchingCards.forEach((card, index) => {
      const article = document.createElement("article");
      article.className = "card-row";
      const number = document.createElement("span");
      number.className = "card-number";
      number.textContent = String(index + 1).padStart(2, "0");
      const cardContent = document.createElement("div");
      cardContent.className = "card-content";
      const front = document.createElement("p");
      front.className = "card-front";
      front.textContent = card.front;
      const back = document.createElement("p");
      back.className = "card-back";
      back.textContent = card.back;
      cardContent.append(front, back);
      const actions = document.createElement("div");
      actions.className = "card-actions";
      actions.append(
        makeButton("icon-button small-icon-button", "Edit card", "↗", () => openCardDialog(card)),
        makeButton("icon-button small-icon-button delete-button", "Delete card", "×", () => deleteCard(card))
      );
      article.append(number, cardContent, actions);
      elements.cardList.append(article);
    });
  }

  function renderDeck() {
    renderDeckList();
    const deck = activeDeck();
    const hasDeck = Boolean(deck);
    const hasCards = Boolean(deck?.cards.length);
    elements.deckTitle.textContent = deck?.name ?? "Pick a deck to begin";
    elements.deckDescription.textContent = deck
      ? "A little progress, one card at a time."
      : "Make space for the things you want to remember.";
    elements.deckOptions.hidden = !hasDeck;
    elements.deckToolbar.hidden = !hasDeck;
    elements.cardCount.textContent = `${deck?.cards.length ?? 0} ${deck?.cards.length === 1 ? "card" : "cards"}`;
    elements.cardsSection.hidden = !hasCards;
    elements.emptyState.hidden = hasCards;
    elements.emptyTitle.textContent = hasDeck ? "A fresh start" : "Start your first deck";
    elements.emptyDescription.textContent = hasDeck
      ? "This deck is ready for its first flashcard."
      : "Create a deck for a subject you want to learn.";
    elements.emptyAction.textContent = hasDeck ? "Add your first card" : "Create a deck";
    elements.emptyAction.onclick = hasDeck ? () => openCardDialog() : () => openDeckDialog();
    renderCards();
  }

  function selectDeck(deckId) {
    state.activeDeckId = deckId;
    elements.cardSearch.value = "";
    currentView = "deck";
    elements.studyView.hidden = true;
    elements.deckView.hidden = false;
    saveState();
    renderDeck();
    elements.mainContent.focus();
  }

  function openDeckDialog(deck = null) {
    dialogOpener = document.activeElement;
    dialogMode = deck ? "edit-deck" : "new-deck";
    editingId = deck?.id ?? null;
    elements.dialogEyebrow.textContent = deck ? "EDIT DECK" : "NEW DECK";
    elements.dialogTitle.textContent = deck ? "Edit deck" : "Create a deck";
    elements.nameField.hidden = false;
    elements.frontField.hidden = true;
    elements.backField.hidden = true;
    elements.itemName.value = deck?.name ?? "";
    elements.itemName.required = true;
    elements.itemFront.required = false;
    elements.itemBack.required = false;
    elements.saveItem.textContent = deck ? "Save changes" : "Create deck";
    elements.dialog.showModal();
    elements.itemName.focus();
  }

  function openCardDialog(card = null) {
    if (!activeDeck()) return;
    dialogOpener = document.activeElement;
    dialogMode = card ? "edit-card" : "new-card";
    editingId = card?.id ?? null;
    elements.dialogEyebrow.textContent = card ? "EDIT CARD" : "NEW CARD";
    elements.dialogTitle.textContent = card ? "Edit card" : "Add a card";
    elements.nameField.hidden = true;
    elements.frontField.hidden = false;
    elements.backField.hidden = false;
    elements.itemFront.value = card?.front ?? "";
    elements.itemBack.value = card?.back ?? "";
    elements.itemFront.required = true;
    elements.itemBack.required = true;
    elements.itemName.required = false;
    elements.saveItem.textContent = card ? "Save changes" : "Add card";
    elements.dialog.showModal();
    elements.itemFront.focus();
  }

  function closeDialog() {
    const opener = dialogOpener;
    elements.dialog.close();
    elements.form.reset();
    dialogMode = null;
    editingId = null;
    dialogOpener = null;
    if (opener instanceof HTMLElement && opener.closest(".card-row")) {
      document.querySelector("#add-card").focus();
    } else if (opener instanceof HTMLElement && opener.isConnected && !opener.hidden) {
      opener.focus();
    } else {
      document.querySelector("#add-card").focus();
    }
  }

  function saveDialogForm(event) {
    event.preventDefault();
    const fieldsToCheck = dialogMode === "new-deck" || dialogMode === "edit-deck"
      ? [elements.itemName]
      : [elements.itemFront, elements.itemBack];
    const blankField = fieldsToCheck.find((field) => !field.value.trim());
    if (blankField) {
      blankField.setCustomValidity("Please enter some text.");
      blankField.reportValidity();
      blankField.setCustomValidity("");
      return;
    }
    if (!elements.form.reportValidity()) return;
    if (dialogMode === "new-deck") {
      const deck = { id: makeId(), name: elements.itemName.value.trim(), cards: [] };
      state.decks.push(deck);
      state.activeDeckId = deck.id;
      elements.cardSearch.value = "";
      announce(`Created deck ${deck.name}.`);
    } else if (dialogMode === "edit-deck") {
      const deck = state.decks.find((item) => item.id === editingId);
      if (deck) deck.name = elements.itemName.value.trim();
      announce("Deck updated.");
    } else if (dialogMode === "new-card" || dialogMode === "edit-card") {
      const deck = activeDeck();
      if (!deck) return;
      const cardData = { front: elements.itemFront.value.trim(), back: elements.itemBack.value.trim() };
      if (dialogMode === "new-card") {
        deck.cards.push({ id: makeId(), ...cardData });
        announce("Card added.");
      } else {
        const card = deck.cards.find((item) => item.id === editingId);
        if (card) Object.assign(card, cardData);
        announce("Card updated.");
      }
    }
    closeDialog();
    saveState();
    renderDeck();
  }

  function deleteDeck() {
    const deck = activeDeck();
    if (!deck || !window.confirm(`Delete "${deck.name}" and all its cards? This cannot be undone.`)) return;
    state.decks = state.decks.filter((item) => item.id !== deck.id);
    state.activeDeckId = state.decks[0]?.id ?? null;
    elements.cardSearch.value = "";
    saveState();
    renderDeck();
    announce(`Deleted deck ${deck.name}.`);
  }

  function deleteCard(card) {
    const deck = activeDeck();
    if (!deck || !window.confirm("Delete this card? This cannot be undone.")) return;
    deck.cards = deck.cards.filter((item) => item.id !== card.id);
    saveState();
    renderDeck();
    announce("Card deleted.");
  }

  function setStudyCard() {
    const deck = activeDeck();
    const card = deck?.cards.find((item) => item.id === studyCardIds[studyIndex]);
    if (!deck || !card) return;
    isFlipped = false;
    elements.studyDeckName.textContent = deck.name;
    elements.studyProgressLabel.textContent = `Card ${studyIndex + 1} of ${studyCardIds.length}`;
    const percent = Math.round(((studyIndex + 1) / studyCardIds.length) * 100);
    elements.studyProgressPercent.textContent = `${percent}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(percent));
    elements.progressFill.style.width = `${percent}%`;
    elements.flashcardFrontSide.textContent = "FRONT";
    elements.flashcardFrontText.textContent = card.front;
    elements.flashcardBackSide.textContent = "BACK";
    elements.flashcardBackText.textContent = card.back;
    elements.flashcard.classList.remove("is-flipped");
    document.querySelector("#flip-button").setAttribute("aria-pressed", "false");
    elements.flashcardFront.setAttribute("aria-hidden", "false");
    elements.flashcardBack.setAttribute("aria-hidden", "true");
    elements.flashcard.setAttribute("aria-label", `Front of card ${studyIndex + 1}: ${card.front}. Press Enter or Space to reveal the answer.`);
  }

  function startStudy(shuffle = false) {
    const deck = activeDeck();
    if (!deck?.cards.length) {
      announce("Add a card before starting a study session.");
      return;
    }
    studyCardIds = deck.cards.map((card) => card.id);
    if (shuffle) shuffleIds();
    studyIndex = 0;
    currentView = "study";
    elements.deckView.hidden = true;
    elements.studyView.hidden = false;
    setStudyCard();
    elements.flashcard.focus();
  }

  function flipCard() {
    const deck = activeDeck();
    const card = deck?.cards.find((item) => item.id === studyCardIds[studyIndex]);
    if (!card) return;
    isFlipped = !isFlipped;
    elements.flashcard.classList.toggle("is-flipped", isFlipped);
    document.querySelector("#flip-button").setAttribute("aria-pressed", String(isFlipped));
    elements.flashcardFront.setAttribute("aria-hidden", String(isFlipped));
    elements.flashcardBack.setAttribute("aria-hidden", String(!isFlipped));
    elements.flashcard.setAttribute("aria-label", `${isFlipped ? "Back" : "Front"} of card ${studyIndex + 1}: ${isFlipped ? card.back : card.front}. Press Enter or Space to ${isFlipped ? "see the prompt" : "reveal the answer"}.`);
  }

  function shuffleIds() {
    for (let index = studyCardIds.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [studyCardIds[index], studyCardIds[randomIndex]] = [studyCardIds[randomIndex], studyCardIds[index]];
    }
  }

  function moveStudy(offset) {
    if (!studyCardIds.length) return;
    studyIndex = (studyIndex + offset + studyCardIds.length) % studyCardIds.length;
    setStudyCard();
  }

  function shuffleStudy() {
    shuffleIds();
    studyIndex = 0;
    setStudyCard();
    announce("Cards shuffled.");
  }

  document.querySelector("#add-deck").addEventListener("click", () => openDeckDialog());
  document.querySelector("#add-deck-header").addEventListener("click", () => openDeckDialog());
  document.querySelector("#add-card").addEventListener("click", () => openCardDialog());
  elements.deckMenu.addEventListener("click", () => {
    const isOpen = !elements.deckActionsMenu.hidden;
    elements.deckActionsMenu.hidden = isOpen;
    elements.deckMenu.setAttribute("aria-expanded", String(!isOpen));
  });
  document.querySelector("#edit-deck").addEventListener("click", () => {
    elements.deckActionsMenu.hidden = true;
    elements.deckMenu.setAttribute("aria-expanded", "false");
    openDeckDialog(activeDeck());
  });
  document.querySelector("#delete-deck").addEventListener("click", () => {
    elements.deckActionsMenu.hidden = true;
    elements.deckMenu.setAttribute("aria-expanded", "false");
    deleteDeck();
  });
  document.querySelector("#study-button").addEventListener("click", () => startStudy());
  document.querySelector("#deck-shuffle").addEventListener("click", () => startStudy(true));
  document.querySelector("#exit-study").addEventListener("click", () => {
    currentView = "deck";
    elements.studyView.hidden = true;
    elements.deckView.hidden = false;
    renderDeck();
    elements.mainContent.focus();
  });
  document.querySelector("#shuffle-button").addEventListener("click", shuffleStudy);
  document.querySelector("#previous-card").addEventListener("click", () => moveStudy(-1));
  document.querySelector("#next-card").addEventListener("click", () => moveStudy(1));
  document.querySelector("#flip-button").addEventListener("click", flipCard);
  elements.flashcard.addEventListener("click", flipCard);
  elements.cardSearch.addEventListener("input", renderCards);
  elements.form.addEventListener("submit", saveDialogForm);
  document.querySelector("#close-dialog").addEventListener("click", closeDialog);
  document.querySelector("#cancel-dialog").addEventListener("click", closeDialog);
  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) closeDialog();
  });
  elements.dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (elements.dialog.open) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
      }
      return;
    }
    if (event.key === "Escape" && !elements.deckActionsMenu.hidden) {
      elements.deckActionsMenu.hidden = true;
      elements.deckMenu.setAttribute("aria-expanded", "false");
      elements.deckMenu.focus();
      return;
    }
    const target = event.target;
    const isTyping = target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    if (currentView === "study" && !isTyping) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveStudy(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveStudy(1);
      } else if (event.key === "Escape") {
        document.querySelector("#exit-study").click();
      } else if (event.code === "Space" && target !== elements.flashcard && !target.closest("button")) {
        event.preventDefault();
        flipCard();
      }
    } else if (event.key === "/" && !isTyping) {
      event.preventDefault();
      elements.cardSearch.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!elements.deckOptions.contains(event.target)) {
      elements.deckActionsMenu.hidden = true;
      elements.deckMenu.setAttribute("aria-expanded", "false");
    }
  });

  renderDeck();
  saveState();
})();