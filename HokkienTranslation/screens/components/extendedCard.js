

import {
    Card,
    createEmptyCard,
    generatorParameters,
    FSRSParameters,
    FSRS,
    RecordLog,
  } from "ts-fsrs";


  class ExtendedCard {
    constructor(card, flashcardId) {
        this.card = card;
        this.flashcardId = flashcardId;
    }

    getDetails() {
        return { ...this.card, flashcardId: this.flashcardId };
    }
}
  
const createExtendedCard = (flashcardId, date) => {
    var card = createEmptyCard(date)
    card.last_review = ""
    card.flashcardId = flashcardId
    return card;
};

export { ExtendedCard, createExtendedCard };