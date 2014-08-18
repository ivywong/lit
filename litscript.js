var ref = new Firebase("https://testingdbs.firebaseio.com/users");
var booksRef;
var loggedIn = false;
var uid = "";
var name = "";

var auth = new FirebaseSimpleLogin(ref, function(error, user){
	if (error) {
    	// an error occurred while attempting login
    	console.error("Login failed: " + error);
  	} else if (user) {
    	// user authenticated with Firebase
    	console.log("User ID: " + user.uid + ", Provider: " + user.provider);
    	loggedIn = true;
		uid = user.uid;

		//redirect user to home page
		$( ":mobile-pagecontainer" ).pagecontainer( "change", "#home", { role: "page" } );

		localStorage.setItem('token', user.firebaseAuthToken);
		
		console.log("Logged in as: " + user.uid);

		if(user.provider === "facebook"){
			name = user.thirdPartyUserData.name;
			$("#welcome").append("Welcome, " , name);
		}	

		ref.child(user.uid).once('value', function(ss) {
			var userID = ss.val();
			//check if user already exists

			if( userID === null) {
				
				console.log("New user!");
				var profileObj = {
					id: user.id,
					uid: user.uid
				};
				if(user.provider === "facebook"){
					profileObj.name = name;
				}
				ref.set(profileObj);
			} else {
				console.log("Already here.");
				console.log(ss.val());
				console.log(ss.val()=== null)
			}
		});
		
		ref = new Firebase("https://testingdbs.firebaseio.com/users/" + uid);
		booksRef = ref.child("books");
		
		checkLoggedIn();
  	} else {
    	// user is logged out
    	console.log("loggedout")
    	checkLoggedIn();
  	}
});

function checkLoggedIn(){
	if(loggedIn){
		$(".showIfLoggedIn").show();
		$(".hideIfLoggedIn").hide();
		console.log("logged in");
	} else {
		$(".showIfLoggedIn").hide();
		$(".hideIfLoggedIn").show();
		console.log("not logged in");
	}

	console.log("loggedIn = ", loggedIn)
}

function signUp(){
	var email = $("#register-email").val();
	var password = $("#register-password").val();
	auth.createUser(email, password, function(error, user) {
  		if (error === null) {
    		console.log("User created successfully:", user);
		} else {
		    console.log("Error creating user:", error);
		    alert(error);
		}
	});
}

function emailLogin(){
	var email = $("#login-email").val();
	var password = $("#login-password").val();
	auth.login('password', {
  		email: email,
  		password: password
	});
}
	
function loginWithFacebook() {
	auth.login("facebook");
}

function logout(){
	clearLists();
	$("#welcome").empty();
	ref = new Firebase("https://testingdbs.firebaseio.com/users");
	loggedIn = false;
    uid = "";
	auth.logout();
	$( ":mobile-pagecontainer" ).pagecontainer( "change", "#main", { role: "page" } );
}

function clearLists(){
	$("#readBooks, #readingBooks, #allBooks, #to-read, #quoteList, #selectQuoteBook").empty();
	console.log("cleared");
}

/* function addtoList(){
	var newAddition=$('input[id="addNew"]').val().trim();
	if ( newAddition ) {
        $('.listItems').append('<li>'+newAddition+'</li>');
		document.getElementById("myForm").reset();
	}
	$("#woohoo").listview();		
	$("#woohoo").listview("refresh");
} */

$(document).ready( function(){
	//checkLoggedIn();
	console.log("Ready.");

	$("#myForm").submit( function(event){
		event.preventDefault();
		//addtoList();
		return false;
	});
	
	$("#quoteForm").submit( function(event){
		event.preventDefault();
		addtoList();
		return false;
	});

	$("#bookInput").submit( function(event){
		event.preventDefault();
		addBook();
		return false;
	});

	$('#bookInput').keypress(function (e) {
		//console.log(e.keyCode);
		if (e.keyCode == 13) {
			addBook();
		}
	});
});

function addBook(){
	var author = $('#authorInput').val();
	var title = $('#titleInput').val();
	var status = $("#statusInput").val();
	//console.log(title, author);
	if(status === ""){
		console.log("no status");
		status = "read";
	}
	booksRef.child(title).set({"author": author, "title": title, "status":status });
	$('#titleInput').val('');
	$('#authorInput').val('');
	$("#statusInput").val("");
	printBooks();
}

function addQuote(){
	var title = $('#selectQuoteBook').val();
	var quote = $("#addNew").val();
	//console.log(title, author);
	//alert(quote)
	booksRef.child(title + "/quotes").push(quote);
	$('#selectQuoteBook').val('');
	$('#addNew').val('');
	printBooks();
}

function deleteBook(clicked){
	var title = $(clicked).parent().find(".booktitle").text();
	console.log("Deleted " + title);
	var book = booksRef.child(title);
	book.remove();
	printBooks();
}

function showBookInfo(clicked){
	$("#currbooktitle, #currbookauthor, #currbookstatus").empty();

	var title = $(clicked).parent().find(".booktitle").text();
	console.log("Show info of " + title);
	var bookRef = booksRef.child(title);
	bookRef.once("value", function(snapshot){
		var book = snapshot.val();
		$("#currbooktitle").append("<i>" + book.title + "</i>");
		$("#currbookauthor").append("by " + book.author);
		$("#currbookstatus").append("Status: " + book.status);
		if(book.quotes !== null){
			for(quote in book.quotes){
				$("#bookquotes").append("<li>'" + book.quotes[quote] + "'</li>");
				//console.log("print quote");
			}
		}
		$("#bookquotes").listview();
		$("#bookquotes").listview("refresh");
	}, function(errorObject){
		console.log("The read failed: " + errorObject.code);
	});
	
	$( ":mobile-pagecontainer" ).pagecontainer( "change", "#bookinfo", { role: "page" } );
}

function printBooks(){
	clearLists();
	booksRef.on("child_added", function (snapshot) {
		//console.log(snapshot.val());
		displayBook(snapshot);
	}, function (errorObject) {
  		console.log('The read failed: ' + errorObject.code);
	});
}

function displayBook(snap){
	//get current page
	var page = $(":mobile-pagecontainer").pagecontainer("getActivePage")[0].id;
	book = snap.val();
	//reload books on current page
	if(page === "home"){
		//Refresh all books list
		$("#allBooks").append("<li><a href='#' onclick='showBookInfo(this)'><h2 class='booktitle'><i>" + 
			 book["title"] + "</i></h2><p class='bookauthor'>" + 
			 book["author"] + "</p><p>Status: " + 
			 book["status"] + "</p></a><a href='#' onclick='deleteBook(this)'></a></li>");
		$("#allBooks").listview();
		$("#allBooks").listview("refresh");
	} else if(page === "read") {
		if(book.status === "read"){
			$("#readBooks").append("<li><a href='#' onclick='showBookInfo(this)'><h2 class='booktitle'><i>" + 
			 book["title"] + "</i></h2><p class='bookauthor'>" + 
			 book["author"] + "</p></a><a href='#' onclick='deleteBook(this)'></a></li>");
			$("#readBooks").listview();
			$("#readBooks").listview("refresh");
		}
	} else if(page === "wishlist"){
		if(book.status === "to read"){
			$("#to-read").append("<li><a href='#' onclick='showBookInfo(this)'><h2 class='booktitle'><i>" + 
			 book["title"] + "</i></h2><p class='bookauthor'>" + 
			 book["author"] + "</p></a><a href='#' onclick='deleteBook(this)'></a></li>");
			$("#to-read").listview();
			$("#to-read").listview("refresh");
		}
	} else if(page === "reading"){
		if(book.status === "reading"){
			$("#readingBooks").append("<li><a href='#' onclick='showBookInfo(this)'><h2 class='booktitle'><i>" + 
			 book["title"] + "</i></h2><p class='bookauthor'>" + 
			 book["author"] + "</h2></p></a><a href='#' onclick='deleteBook(this)'></a></li>");
			$("#readingBooks").listview();
			$("#readingBooks").listview("refresh");
		}
	} else if(page==="quotes"){
		$("#selectQuoteBook").append("<option value='" + book["title"] + "'>" + book["title"] + " by " + book["author"] + "</option>");
		for (quote in book.quotes){
			$("#quoteList").append("<li>'" + book.quotes[quote] + "'<i><p>" + book["title"] + "</p></i>" + "</li>");
		}
		//$("#quoteList").append("<li><a href='#'><i>" + book["title"] + "</i><h2><p>" + book["author"] + book["quotes"] + "</h2></p></a><a href='#' onclick='deleteBook(this)'></a></li>");
		$("#quoteList").listview();
		$("#quoteList").listview("refresh");
	}
	console.log("Displayed");
}
