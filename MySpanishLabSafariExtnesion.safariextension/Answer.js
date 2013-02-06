// question types
const QuestionType = {
	FILL_IN_BLANKS : "Fill In Blanks Static",
	MULTIPLE_CHOICE : "Multiple Choice Static",
	PULL_DOWN : "Pull Down List",
	SELECT_BLANK : "Select a blank",
	MATCHING : "Matching",
	FLASH : "Macromedia Flash"
}

/*
 * A class representing a main answer to a question.
 */
function Answer(questionType, questionId) {
	// A string describing the type of question this is an answer to
	this.questionType = questionType;
	// A string which represents the ID of this question
	this.questionId = questionId;
	// An array of SubAnswer objects which represent the sub-answers
	this.subAnswers = [];
	
	// toString representation
	this.toString = function() {
		return "Answer to question of type=["+ questionType +"] with id=["+ questionId +"]";
	}
}

/*
 * A class representing an answer to a sub-question.
 */
function SubAnswer(id, answer) {
	// A string which represents the ID of this individual answer
	this.id = id;
	// A string containing the answer to this individual question
	this.answer = answer;
	
	// toString representation
	this.toString = function() {
		return "Sub answer with id=["+ id +"] and answer=["+ answer +"]";
	}
}