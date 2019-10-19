/*
================================================================================================================
Front-End Javascript File
================================================================================================================
*/
const port = 80;
const socket = io(); // initialize our socket.io variable
const cardForm = document.getElementById("card-container"); // card container element
const resetContainer = document.getElementById("reset-container"); // reset button container
const votingContainer = document.getElementById("voting-container"); // get the voting container element
const messageContainer = document.getElementById("message-container"); // roster container
const name = getUserName(); // get the users name

var votingFinished = false; // used to track if each vote is the last vote or not

socket.emit("new-user", name); // emit a new user connection to the socket

/*
================================================================================================================
Page Event Listeners
================================================================================================================
*/
cardForm.addEventListener("submit", e => {
    e.preventDefault(); // prevent the page from reloading
    const vote = document.activeElement.textContent; // get the vote value from the text of the button
    consoleLog("vote cast:" + vote);
    socket.emit("send-vote", vote); // emit the vote to the socket
});

resetContainer.addEventListener("reset", e => {
    e.preventDefault(); // prevent the page from reloading
    socket.emit("reset"); // emit the reset command to the socket
});

/*
================================================================================================================
Modal Code
================================================================================================================
*/
// Get the modal
var modal = document.getElementById("aboutModal");
// Get the button that opens the modal
var btn = document.getElementById("aboutButton");
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
// When the user clicks the button, open the modal
btn.onclick = function() {
    modal.style.display = "block";
}
// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
    modal.style.display = "none";
    }
}

/*
================================================================================================================
Socket Event Listeners
================================================================================================================
*/
socket.on("user-connected", users => {
    if (firstLoad()) {
        fillVotingContainer(users);
    } else {
        newVoter = Object.values(users)[Object.values(users).length - 1];
        addVoter(`${newVoter}`);
    }
});

socket.on("vote", data => {
    castVote(`${data.user}`, `${data.vote}`);
});

socket.on("voting-results", votes => {
    consoleLog(votingFinished);
    if (!votingFinished) {
        updateCards(votes);
        votingFinished = true;
    }
});

socket.on("user-disconnected", user => {
    consoleLog("user disconnected");
    removeVoter(user);
});

socket.on("reset-page", () => {
    for (let index = 0; index < 10; index++) {
        reset();
    }
});

/*
================================================================================================================
Functions
================================================================================================================
*/
function getUserName() {
    userName = prompt("What is your name?");
    while (userName == "" || userName == null) {
        alert("Invalid username. Please re-enter.");
        userName = prompt("What is your name?");
    }
    return userName;
}


// if the voting container only contains 1 element, then there's only 1 user connected
function firstLoad() {
    consoleLog(votingContainer.childElementCount);
    if (votingContainer.childElementCount == 1) {
        return true;
    } else {
        return false;
    }
}

// iterate over the users object and call the addVoter function to add each user to the voting container
function fillVotingContainer(users) {
    for (const key in users) {
        if (users.hasOwnProperty(key)) {
            const userName = users[key];
            consoleLog("iterating through users... current user: " + userName);
            addVoter(userName);
        }
    }
}

// when a user votes, find their poker card (by matching the cards ID to the users name)
// and then update the card from a blank card to a card with a pattern
// finally, check if the current vote was the last vote or not; if so, emit 'voting-finished' to the socket
function castVote(user, vote) {
    var pokerCard = document.getElementById(user);
    pokerCard.setAttribute("src", "/images/poker_card.png");
    consoleLog("pokerCard: " + pokerCard);
    if (voteFinished()) {
        consoleLog("voting finished");
        socket.emit("voting-finished");
    }
}

// takes a user (string) parameter and adds:
// 1) a voting card to the voting container for the user
// 2) the users name to the roster container
function addVoter(user) {
    consoleLog("calling addVoter with user: " + user);
    var pokerCard = document.createElement("img");
    pokerCard.setAttribute("src", "/images/blank_card.png"); // blank card because the user hasn't voted yet
    pokerCard.setAttribute("class", "pokerCard");
    pokerCard.setAttribute("id", user); // set the ID of the card to be equal to the user's name
    pokerCard.setAttribute("alt", "pointing poker card");
    votingContainer.appendChild(pokerCard);
    var messageSpace = document.createElement("p");
    messageSpace.setAttribute("class", "joinMessage");
    messageSpace.setAttribute("id", user); // add the users name to the roster
    messageContainer.appendChild(messageSpace);
    var resultText = document.createTextNode(user);
    messageSpace.appendChild(resultText);
}

// takses a user(string) parameter and removes:
// 1) their card from the voting container
// 2) their name from the roster
function removeVoter(user) {
    var pokerCard = document.getElementById(user);
    votingContainer.removeChild(pokerCard);
    var rosterEntry = document.getElementById(user);
    messageContainer.removeChild(rosterEntry);
}

// checks the 'src' attribute of all cards in the voting container
// if any of them are still using the blank_card image, returns false (else, returns true)
function voteFinished() {
    var finished = true;
    var arrCards = votingContainer.getElementsByTagName("IMG");
    for (const card in arrCards) {
        if (arrCards.hasOwnProperty(card)) {
            const element = arrCards[card];
            if (element.getAttribute("src") == "/images/blank_card.png") {
                finished = false;
            }
        }
    }
    return finished;
}

// resets:
// 1) all cards to the blank_card image
// 2) all results to empty
// 3) votingFinished variable to false
function reset() {
    var arrCards = votingContainer.getElementsByTagName("IMG");
    for (const card in arrCards) {
        if (arrCards.hasOwnProperty(card)) {
            const element = arrCards[card];
            element.setAttribute("src", "/images/blank_card.png");
        }
    }
    var arrResults = votingContainer.getElementsByTagName("P");
    for (const result in arrResults) {
        if (arrResults.hasOwnProperty(result)) {
            const element = arrResults[result];
            element.parentNode.removeChild(element);
        }
    }
    votingFinished = false;
    consoleLog(votingContainer.children);
}

// takes a votes object and:
// 1) decorates the voting container with a results header
// 2) tallies up the votes
// 3) calls some helper methods to draw the votes and stats to the page
function updateCards(votes) {
    var voteSum = 0;
    var voteCount = 0;
    consoleLog("calling updateCards");
    var resultHeader = document.createElement("p");
    resultHeader.setAttribute("class", "resultHeader");
    votingContainer.appendChild(resultHeader);
    var resultHeaderText = document.createTextNode("Results:");
    resultHeader.appendChild(resultHeaderText);
    for (const user in votes) {
        if (votes.hasOwnProperty(user)) {
            const singleVote = votes[user];
            for (const vote in singleVote) {
                if (singleVote.hasOwnProperty(vote)) {
                    if (singleVote[vote] == '?') {
                        var result = '?';
                        var nanVote = true;
                    } else{
                        var result = parseInt(singleVote[vote]);
                    }
                    
                    var resultSpace = document.createElement("p");
                    voteCount = voteCount + 1;
                    consoleLog(result);
                    voteSum = voteSum + result;
                    drawVote(resultSpace, result, voteCount);
                }
            }
        }
    }
    consoleLog(voteSum);
    consoleLog(voteCount);
    var breakPoint = document.createElement("br");
    resultSpace.appendChild(breakPoint);
    if (nanVote) {
        voteAverage = '?';
    } else{
        var voteAverage = voteSum / voteCount;
    }
    consoleLog("vote average: " + voteAverage);
    drawStats(voteAverage);
}

// draws a result (int) and voteCount (int) to the page
function drawVote(resultSpace, result, voteCount) {
    resultSpace.setAttribute("class", "votingResult");
    votingContainer.appendChild(resultSpace);
    var resultText = document.createTextNode("Vote " + voteCount + ": " + result);
    resultSpace.appendChild(resultText);
}

// draws a voteAverage (int) to the page
function drawStats(voteAverage) {
    var averageSpace = document.createElement("p");
    averageSpace.setAttribute("class", "averageResult");
    votingContainer.appendChild(averageSpace);
    var averageText = document.createTextNode("Average: " + voteAverage);
    averageSpace.appendChild(averageText);
}

// using this to only enable logging when the app is running in DEV (port 3000)
function consoleLog(message) {
    if (port == 3000) {
        console.log(message);
    }
}