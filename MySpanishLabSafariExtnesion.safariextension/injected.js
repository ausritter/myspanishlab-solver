var requirePromptToSubmit = false;
var placeToShowMessages;

/*
 * Intitialization.
 */
$(document).ready(function() {
	// make sure this isn't an iframe or a non-activity page
	if (window.top === window && document.title === "SAM Activity") {
		placeToShowMessages = document.getElementsByClassName("tdmsbl1")[0];
		//document.getElementById("divContent").getElementsByTagName("div")[0].getElementsByTagName("table")[0]
			
		// register for message events
		safari.self.addEventListener("message", replyToMessage, false);
		// start by getting the current settings
		safari.self.tab.dispatchMessage("getSettings");
		
		// now determine what kind of page we are looking at
		if (document.getElementById("btnlaunchtraining")) {
			// (a "Try Again" button was found, so we are at a results screen of some sort)
			safari.self.tab.dispatchMessage("isSubmitted?");
		}
		else {
			// we are either at the initial entry screen or a try again screen
			// we can't know for sure until we call back to the global page and see if we have any answers on file or not
			safari.self.tab.dispatchMessage("getAnswers");
		}
	}
	// otherwise, injected script ignored
});

/*
 * Callback function used to receieve messages passed from the global page.
 */
function replyToMessage(aMessageEvent) {
	// Answer request returned. Now we can paste them in.
	if (aMessageEvent.name === "gotAnswers") {
		var answers = aMessageEvent.message;
		initEntryPage(answers);
	}
	// isSubmitted request returned. Now we can try again.
	else if (aMessageEvent.name === "isSubmittedVal") {
		var isSubmitted = aMessageEvent.message;
		tryAgainIfNeeded(isSubmitted);
	}
	// Global settings changed.
	else if (aMessageEvent.name === "settingsChanged") {
		var settings = aMessageEvent.message;
		requirePromptToSubmit = settings["requirePromptToSubmit"];
		//alert("settings changed event received; now set to "+ requirePromptToSubmit);
	}
}

/*
 * Error encountered.
 * errorMessage is a string to show to the user.
 * excludePrefix=true avoids having the "ERROR:" prefix in the message.
 */
function showError(errorMessage, excludePrefix) {
	var domObj = document.createElement("p");
	var displayText = "";
	if (!excludePrefix) displayText += "ERROR: ";
	displayText += errorMessage + "<br /><a href='mailto:david.idol+msl@gmail.com?subject=MSL Solver Bug: "+errorMessage+"'>File a bug report?</a>";
	domObj.innerHTML = displayText;
	domObj.className = "solverMessage errorType";
	
	placeToShowMessages.appendChild(domObj);
	$(domObj).hide().fadeIn(600);
}

/*
 * Shows a (non-error) feedback message to the user.
 */
function showMessage(message) {
	var domObj = document.createElement("p");
	domObj.innerHTML = message;
	domObj.onclick = function() { $(domObj).fadeOut(400); };
	domObj.className = "solverMessage basicType";
	
	placeToShowMessages.appendChild(domObj);
	$(domObj).hide().fadeIn(600);
}

/*
 * Resets the gloabl page state back to normal (no answers; not submitted).
 */
function resetState() {
	safari.self.tab.dispatchMessage("haveSubmitted", false);
	safari.self.tab.dispatchMessage("setAnswers", null);
}

/*
 * Results page encountered.
 */
function tryAgainIfNeeded(isSubmitted) {
	// check our score
	var scoreString = document.getElementById("divgradeholder").childNodes[2].innerHTML;
	
	var matcher = /\d+/.exec(scoreString);
	var scoreNumber = (matcher !== null)? +(matcher[0]) : -1;
	
	//console.log("score = " + scoreNumber);
	
	// check if the score is < 100%
	if (scoreNumber < 100) {
		// if so, we check if we submitted already
		if (isSubmitted) {
			showError("Oops! It looks like the answers we submitted were not 100% correct. You may want to solve any incorrect problems yourself.", true);
			resetState();
		}
		// if not, we copy the answers then go to the next screen
		else {
			copyAnswers();
			window.location.href = "javascript:tryagain();";
		}
	}
	else {
		// done, we got a perfect score!
		showMessage("Correct answers submitted successfully! You got a perfect score :)");
		resetState();
	}
}

function dispatchSubmitFormCommand() {
	// (we can't execute javascript functions outside of this namespace normally, so we must use the "javascript:" pseudo-protocol)
	if (requirePromptToSubmit) window.location.href = "javascript:doSubmit();";
	else window.location.href = "javascript:doSubmit(); document.getElementById('btnfinish').click();";
}


/*
 * Submits fake answers on the current assignment.
 */
function submitDummyAnswers() {
	// first, fill dummy data in all of the inputs of the form

	// all inputs
	var inputs = document.getElementsByTagName("input");
	for (var i=0; i<inputs.length; i++) {
		var input = inputs[i];
		if (input.getAttribute("question") == "true") {
			var type = input.getAttribute("type");
			// put dummy text in the text inputs
			if (type == "text") input.value = "Solving...";
			// check all of the checkboxes and radio buttons
			else if (type == "radio" || type == "checkbox") input.checked = true;
		}
	}
	
	// all dropdowns
	inputs = document.getElementsByTagName("select");
	for (var i=0; i<inputs.length; i++) {
		var input = inputs[i];
		if (input.getAttribute("question") == "true") {
			input.value = input.options[1].value; // use the first non-blank option
		}
	}
	
	// next, do the submit action on the form
	dispatchSubmitFormCommand();
}

/*
 * Entry page encountered.
 */
function initEntryPage(answers) {
	if (answers === null) {
		// initial screen with no answers found yet
		var nodeToAddTo = document.getElementById("saveForLater").parentNode.parentNode;//document.getElementById("trGeneralSetting");
	
		var solveBtn = document.createElement("button");
		solveBtn.innerHTML = "SOLVE";
		solveBtn.onclick = function() { submitDummyAnswers(); return false; };
		solveBtn.className = "btn";
		solveBtn.title = "Solves the SAM Activity in a single click!";
		
		nodeToAddTo.insertBefore(solveBtn, nodeToAddTo.firstChild);
		$(solveBtn).hide().fadeIn(1200);
	}
	else {
		// we have the answers and now we are just going to resubmit
		pasteAnswers(answers);
	}
}


/*
 * Finds the correct answers for the elements scraped from the page and
 * holds on to them.
 */
function copyAnswers() {
	// get the answer IDs and types from the page
	var answers = getAnswersFromPage();
	//console.log("answers:");
	//console.log(answers);
	
	// make sure something was actually returned
	if (answers.length > 0) {
		// get the actual answer corresponding to the answer number
		ans:for (var i=0, length = answers.length; i<length; i++) {
			// all sub answers
			var subAnswers = answers[i].subAnswers;
			subans:for (var j=0, length2 = subAnswers.length; j<length2; j++) {
				var answerID = subAnswers[j].id;
				
				var answer;
				// try to find the DOM
				
				var ansDOM = document.getElementById("hdnanswer_" + answerID); // regular question types
				if (ansDOM === null) ansDOM = document.getElementById("hdnanswer_AMS_" + answerID); // multiple choice question types
				if (ansDOM != null) {
					answer = ansDOM.value;
					// see if this answer has a ' - '
					var matchInd = answer.search(/ - /);
					// if so, only take the second part
					if (matchInd != -1) answer = answer.substr(matchInd+3, answer.length);
				}
				else {
					showError("No hdanswer_"+questionID+" field found on the page");
					return;
				}
				
				answer = answer.split(/(,| (or|and)) /)[0];
				
				// actually set the right answer
				subAnswers[j].answer = answer;
			}
		}
		// set the answers global var
		safari.self.tab.dispatchMessage("setAnswers", answers);
	}
	else {
		showError("Could not copy answers because no answers were found on the page.");
	}
}

/*
 * Find the question fields on the page and builds the answer array.
 * When this function returns the answer objects' subAnswers contain ONLY the id and not the answer
 */
function getAnswersFromPage() {
	// array of Answer objects
	var answers = [];
	
	var holder = document.getElementById("nextQuextion");
	if (holder != null) {
		// "DIV" method
		
		var children = holder.childNodes; // all child nodes of this element
		
		var child;
		for (var i = 0, length = children.length; i < length; i++) {
			child = children[i];
			
			// loop through the divs of type question
			if (child.nodeName == "DIV" && child.getAttribute("type") == "Question") {
				var id = child.id.substr(1,child.id.length); // remove the underscore (_)
				var type = child.getAttribute("questiontype");
				// create the answer
				var answer = new Answer(type, id);
				
				// now add the sub-answers
				var ids = [];
				var moreChildren = child.getElementsByTagName("a");
				for (var j = 0, length2 = moreChildren.length; j < length2; j++) {
					var nextA = moreChildren[j];
					// make sure the ID is valid
					if (nextA.id.length >= 20) {
						var matcher = /10000.*$/.exec(nextA.id);
						if (matcher != null) {
							// Add this ID to the array
							ids.push(matcher[0]);
						}
					}
				}
				ids = ids.unique(); // remove duplicate IDs
				
				// now make the SubAnswer objects
				for (var j=0, length2 = ids.length; j < length2; j++) {
					var subAns = new SubAnswer(ids[j], undefined); // note: no actual answer found yet
					answer.subAnswers.push(subAns);
				}
				
				// add this answer to the array
				answers.push(answer);
			}
		}
	}
	return answers;
}


/*
 * Inserts the copies answers into the right fields and submits.
 */
function pasteAnswers(answers) {
	//console.log("answers:");
	//console.log(answers);
	
	var numAnswers = answers.length;
	
	var ansNum = 0;
	if (numAnswers > 0) {
		var holder = document.getElementById("nextQuextion");
		var children = holder.childNodes;
		var child;
		
		// for every DIV
		div: for (var i = 0, length = children.length; i < length; i++) {
			child = children[i];
			
			if (child.nodeName == "DIV" && child.getAttribute("type") == "Question") {
				var type = child.getAttribute("questiontype");
				
				var ans = answers[ansNum];
				var subAnswers = ans.subAnswers;
				
				/*
				// Log the question type information
				
				console.log("type found from 'questiontype' attribute:");
				console.log(type);
				
				console.log("ans.questionType:")
				console.log(ans.questionType);
				
				console.log("are they the same? " + (type == ans.questionType));
				*/
				
				
				// MULTIPLE_CHOICE
				if (type === QuestionType.MULTIPLE_CHOICE && ans.questionType === QuestionType.MULTIPLE_CHOICE) {
					// go through every subanswer
					subAs:for (var j=0, length2 = subAnswers.length; j < length2; j++) {
						var subA = subAnswers[j];
						
						var inputs = document.getElementsByName(subA.id);//child.getElementsByName(subA.id);
						
						// look at every checkbox to see if it matches the right answer
						chckbox:for (var k=0, length3 = inputs.length; k < length3; k++) {
							var checkBox = inputs[k];
							var parent = checkBox.parentNode;
							var labels = parent.getElementsByTagName("label");
							label:for (var l=0, length4 = labels.length; l < length4; l++) {
								// found, so check it
								if (labels[l].innerHTML === subA.answer) {
									checkBox.checked = true;
									break chckbox;
								}
							}
						}
					}
					safari.self.tab.dispatchMessage("haveSubmitted", true);
				}
				
				// FILL_IN_BLANKS
				else if (type === QuestionType.FILL_IN_BLANKS && ans.questionType === QuestionType.FILL_IN_BLANKS) {
					// go through every subanswer
					subAs:for (var j=0, length2 = subAnswers.length; j < length2; j++) {
						var subA = subAnswers[j];
						
						var inputs = document.getElementsByName(ans.questionId + "$" + subA.id);//child.getElementsByName(subA.id);
						txts:for (var k=0, length3 = inputs.length; k<length3; k++) {
							console.log(inputs[k]);
							console.log(subA.answer);
							
							inputs[k].value = subA.answer;
						}
					}
					safari.self.tab.dispatchMessage("haveSubmitted", true);
				}
				
				// PULL_DOWN, SELECT_BLANK, or MATCHING
				else if ((type === QuestionType.PULL_DOWN && ans.questionType === QuestionType.PULL_DOWN)
						|| (type === QuestionType.SELECT_BLANK && ans.questionType === QuestionType.SELECT_BLANK)
						|| (type === QuestionType.MATCHING && ans.questionType === QuestionType.MATCHING)) {
					
					var subASelects = document.getElementsByName(ans.questionId);//document.getElementsByTagName("select");
					//TODO: For now we will just assume this is a "question=true"
										
					// go through every subanswer
					subAs:for (var j=0, length2 = subAnswers.length; j < length2; j++) {
						var subA = subAnswers[j];
						var subASelect = subASelects[j];
						
						if (subASelect.getAttribute("question") === "true") {
							// we have to find the right "value" to use here
							
							var options = subASelect.childNodes;
							
							for (var k=0, length3 = options.length; k < length3; k++) {
								var option = options[k];
								
								//console.log("looking at option "+k+"...");
								//console.log(option);
								
								if (option.innerText.indexOf(subA.answer) != -1) {
									//console.log(" correct answer SET to "+option.value);
									subASelect.value = option.value;
								}
								//else console.log(" correct answer not found");
							}
						}
					}
					safari.self.tab.dispatchMessage("haveSubmitted", true);
				}
				
				// FLASH
				else if (type === QuestionType.FLASH) {
					showMessage("Flash-based (multimedia) questions cannot be solved using this tool.");
					resetState();
					return;
				}
				
				else {
					showError("Unexpected question type encountered.");
					resetState();
					return;
				}
				
				// move to the next answer
				ansNum++;
			}
		}
		
		// submit
		dispatchSubmitFormCommand();
	}
	else showError("No answers copied yet");
}