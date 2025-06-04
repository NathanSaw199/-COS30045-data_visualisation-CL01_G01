
console.log("Simple flash-cards.js loaded");

function updateFlashCards() {
  const container = document.getElementById('flashCardsContainer');
  
  
  document.querySelectorAll('.flash-card').forEach(card => {
    card.classList.remove('show');
  });

  //selected jurisdictions
  const selectedJurisdictions = Array.from(
    document.querySelectorAll('#jurisdictionDropdown input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  // this shows overall information when no selection is made
  if (selectedJurisdictions.length === 0) {
    document.getElementById('overviewNote').classList.add('show');
    container.classList.remove('multiple');
    return;
  }

  // carsds for each jurisdiction
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
    }
  });

  // multi state note
  if (selectedJurisdictions.length > 1) {
    document.getElementById('multiStateNote').classList.add('show');
    container.classList.add('multiple');
  } else {
    container.classList.remove('multiple');
  }
}


document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    
    document.querySelectorAll('#jurisdictionDropdown input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateFlashCards);
    });
    
    updateFlashCards();
    
    console.log("Simple flash card listeners added");
  }, 1000);
});