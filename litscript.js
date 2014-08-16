var ref = new Firebase("https://testingdbs.firebaseio.com/users");
var booksRef;
var loggedIn = false;
var uid = "";

var auth = new FirebaseSimpleLogin(ref, function(error, user){
	if (error) {
    	// an error occurred while attempting login
    	console.error("Login failed: " + error);
  	} else if (user) {
    	// user authenticated with Firebase
    	console.log("User ID: " + user.uid + ", Provider: " + user.provider);
    	loggedIn = true;
		uid = user.uid;

		localStorage.setItem('token', user.firebaseAuthToken);
		
		console.log("Logged in as: " + user.uid);
		
		ref.child(user.uid).once('value', function(ss) {
			var userID = ss.val();
			if( userID === null ) {
				console.log("New User!");
				var profileObj = {
					id: user.id,
					uid: user.uid,
					name: user.thirdPartyUserData.name
					//userData: user.thirdPartyUserData
				};
				ref.child(user.uid).set(profileObj);
			} else {
				console.log("Already here");
			}
		});
		ref = new Firebase("https://testingdbs.firebaseio.com/users/" + uid);
		booksRef = ref.child("books");

		checkLoggedIn();
  	} else {
    	// user is logged out
    	loggedIn = false;
    	uid = "";
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
	
function loginWithFacebook() {
	auth.login("facebook");
}

function logout(){
	auth.logout();
}

function addtoList(){
	var newAddition=$('input[id="addNew"]').val().trim();
	if ( newAddition ) {
        $('.listItems').append('<li>'+newAddition+'</li>');
		document.getElementById("myForm").reset();
	}
	$("#woohoo").listview();		
	$("#woohoo").listview("refresh");
}

$(document).ready( function(){
	//checkLoggedIn();
	console.log("Ready.");

	$("#myForm").submit( function(event){
		event.preventDefault();
		addtoList();
		return false;
	});

	$('#bookInput').keypress(function (e) {
		//console.log(e.keyCode);
		if (e.keyCode == 13) {
			var author = $('#authorInput').val();
			var title = $('#titleInput').val();
			//console.log(title, author);
			booksRef.child(title).set({"author": author, "title": title});
			$('#titleInput').val('');
			$('#authorInput').val('');
		}
	});
});

function printBooks(){
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
	if(page === "home"){
		//Refresh all books list
		$("#allBooks").append("<li><a href='#'><h2><i>" + book["title"] + "</i></h2><p>" + book["author"] + "</h2></p></a></li>");
		$("#allBooks").listview();
		$("#allBooks").listview("refresh");
	} else if(page === "read") {
		if(book.status === "read"){
			$("#readBooks").append("<li><a href='#'><i>" + book["title"] + "</i><h2><p>" + book["author"] + "</h2></p></a></li>");
			$("#readBooks").listview();
			$("#readBooks").listview("refresh");
		}
	} else if(page === "wishlist"){
		if(book.status === "to read"){
			$("#to-read").append("<li><a href='#'><i>" + book["title"] + "</i><h2><p>" + book["author"] + "</h2></p></a></li>");
			$("#to-read").listview();
			$("#to-read").listview("refresh");
		}
	}
}
