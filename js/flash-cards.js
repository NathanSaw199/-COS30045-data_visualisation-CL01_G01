console.log("Simple flash-cards.js loaded with separate boxes");

function updateFlashCards() {
  const container = document.getElementById('flashCardsContainer');
  
  // Clear all cards
  document.querySelectorAll('.flash-card').forEach(card => {
    card.classList.remove('show');
  });

  // Get selected jurisdictions
  const selectedJurisdictions = Array.from(
    document.querySelectorAll('#jurisdictionDropdown input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  let hasVisibleCards = false;

  // Show overview when no selection is made
  if (selectedJurisdictions.length === 0) {
    document.getElementById('overviewNote').classList.add('show');
    hasVisibleCards = true;
    container.classList.remove('multiple');
  } else {
    // Show individual cards for each selected jurisdiction
    selectedJurisdictions.forEach(jurisdiction => {
      let cardId;
      switch(jurisdiction) {
        case 'VIC': cardId = 'vicNote'; break;
        case 'NSW': cardId = 'nswNote'; break;
        case 'QLD': cardId = 'qldNote'; break;
        case 'SA': cardId = 'saNote'; break;
        case 'TAS': cardId = 'tasNote'; break;
        case 'WA': cardId = 'waNote'; break;
        case 'NT': cardId = 'ntNote'; break;
        case 'ACT': cardId = 'actNote'; break;
      }
      
      if (cardId) {
        document.getElementById(cardId).classList.add('show');
        hasVisibleCards = true;
      }
    });

    // Show multistate comparison note when multiple jurisdictions selected
    if (selectedJurisdictions.length > 1) {
      document.getElementById('multiStateNote').classList.add('show');
      container.classList.add('multiple');
    } else {
      container.classList.remove('multiple');
    }
  }

  // Show or hide the entire container
  if (hasVisibleCards) {
    container.classList.add('has-visible-cards');
  } else {
    container.classList.remove('has-visible-cards');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    // Setup jurisdiction dropdown listeners
    document.querySelectorAll('#jurisdictionDropdown input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateFlashCards);
    });
    
    // Initial update
    updateFlashCards();
    
    console.log("Simple flash card separate boxes initialized");
  }, 1000);
});