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
	$("#readBooks, #readingBooks, #allBooks, #to-read, #quoteList, #bookquotes, #selectQuoteBook").empty();
	console.log("cleared");
}

$(document).ready( function(){
	checkLoggedIn();
	console.log("Ready.");

	//maybe combine these all into one thing later
	$("#myForm").submit( function(event){
		event.preventDefault();
		return false;
	});
	
	$("#quoteForm").submit( function(event){
		event.preventDefault();
		return false;
	});
	
	$("#updateStatus").submit( function(event){
		event.preventDefault();
		updateStatus();
		return false;
	});

	$("#bookInput").submit( function(event){
		event.preventDefault();
		addBook();
		return false;
	});

	$("#formThing").submit( function(event){
		event.preventDefault();
		return false; 
	});

	$("#singleBookQuote").submit( function(event){
		event.preventDefault();
		return false; 
	});

	$('#bookInput').keypress(function (e) {
		//console.log(e.keyCode);
		if (e.keyCode == 13) {
			addBook();
		}
	});
});

//not working
$('#bookinfo').on('pagecontainershow',function(event){
    var myselect = $("select#editbookstatus1");
	if($("#currbookstatus").text() === "read"){
		myselect[0].selectedIndex = 0;
	} else if($("#currbookstatus").text() === "reading"){
		myselect[0].selectedIndex = 1;
	} else {
		myselect[0].selectedIndex = 2;
	}
    myselect.selectmenu("refresh");
	console.log("update status menu");
});

function addBook(){
	var author = $('#authorInput').val();
	var title = $('#titleInput').val();
	//format title so it doesn't contain invalid characters
	title = title.replace(/[.$\[\]\/]/g, "");
	console.log("Added " + title);
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
	if(quote !== ""){
		booksRef.child(title + "/quotes").push(quote);
	}
	$('#selectQuoteBook').val('');
	$('#addNew').val('');
	printBooks();
}

function addSpecQuote(){
	var title = $('#currbooktitle').text();
	var quote = $("#currnewquote").val();
	//console.log(title, author);
	//alert(quote)
	if(quote !== ""){
		booksRef.child(title + "/quotes").push(quote);
	}
	$('#currnewquote').val('');
	reloadQuotes();
}

//edit the status of the book from the book info page
function updateStatus(){
	var status = $("#editstatusinput1").val();
	//console.log(title, author);
	if(status === ""){
		console.log("no status");
		status = "read";
	}
	var bookRef = booksRef.child($("#currbooktitle").text());
	bookRef.update({ "status": status }); 
	$("#editstatusinput1").val("");
	console.log("updated status");
}

function deleteBook(clicked){
	var title = $(clicked).parent().find(".booktitle").text();
	console.log("Deleted " + title);
	var book = booksRef.child(title);
	book.remove();
	printBooks();
}

function deleteQuote(clicked){
	var page = $(":mobile-pagecontainer").pagecontainer("getActivePage")[0].id;
	var title;
	if(page === "quotes"){ 
		title = $(clicked).parent().find(".booktitle").text();
	}
	else if(page === "bookinfo"){
		title = $("#currbooktitle").text();
	}
	var quoteid = $(clicked).parent().find("#quoteID").val();
	console.log("Deleted quote from " + title);
	console.log("Quote ID: " + quoteid);
	var quote = booksRef.child(title + "/quotes/" + quoteid);
	quote.remove();
	if(page === "quotes"){ 
		printBooks(); 
	}
	else if(page === "bookinfo"){
		reloadQuotes();
	}
}

//display the book page
function showBookInfo(clicked){
	$("#currbooktitle, #currbookauthor, #currbookstatus").empty();

	var title = $(clicked).parent().find(".booktitle").text();
	//console.log("Show info of " + title);
	var bookRef = booksRef.child(title);
	bookRef.once("value", function(snapshot){
		var book = snapshot.val();
		$("#currbooktitle").append("<i>" + book.title + "</i>");
		$("#currbookauthor").append("by " + book.author);
		$("#currbookstatus").append("Status: " + book.status);
		reloadQuotes();
	}, function(errorObject){
		console.log("The read failed: " + errorObject.code);
	});
	$( ":mobile-pagecontainer" ).pagecontainer( "change", "#bookinfo", { role: "page" } );
	console.log("Show info of " + title);
}

//reload quotes on the book page
function reloadQuotes() {
	clearLists();
	var bookRef = booksRef.child($("#currbooktitle").text());
	bookRef.once("value", function(snapshot){
		var book = snapshot.val();
		if(book.quotes !== null){
			for(quote in book.quotes){
				//replace newlines with <br> so spacing is correct(er)
				var formattedQuote = book.quotes[quote].replace(/\n/g, "<br>");
				$("#bookquotes").append("<div data-role='collapsible' data-iconpos='right' data-filtertext='" + book.quotes[quote] + " " + book["title"] + "'>" + 
			 	 "<h2>'" + book.quotes[quote] + "'</h2>" + 
			 	 "<p>'" + formattedQuote + "'</p><i>" + 
			 	 "<input type='hidden' id='quoteID' value='" + quote + "'>" + 
			 	 "<a href='#' class='ui-btn ui-btn-icon-left ui-icon-delete ui-corner-all ui-btn-inline' onclick='deleteQuote(this)'>Delete</a></div>");
				//console.log("print quote");
			}
		}
		$( "#bookquotes" ).collapsibleset().trigger('create')
	}, function(errorObject){
		console.log("The read failed: " + errorObject.code);
	});
}

//show/update all the books in the book lists
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
		console.log("Added book to dropdown");
		for (quote in book.quotes){
			$("#quoteList").append("<div data-role='collapsible' data-iconpos='right' data-filtertext='" + book.quotes[quote] + " " + book["title"] + "'>" + 
			 "<h2>'" + book.quotes[quote] + "'</h2>" + 
			 "<p>'" + book.quotes[quote] + "'</p><i>" + 
			 "<p class='booktitle'>" + book["title"] + "</p></i>" + 
			 "<input type='hidden' id='quoteID' value='" + quote + "'>" + 
			 "<a href='#' class='ui-btn ui-btn-icon-left ui-icon-delete ui-corner-all ui-btn-inline' onclick='deleteQuote(this)'>Delete</a></div>");
		}
		$( "#quoteList" ).collapsibleset().trigger('create');
	}
	console.log("Displayed");
}

//search using google books api
function submitStuff() {
	//prints the input 
    var element = document.getElementById('exploreTitleInput').value;
    console.log(element);
    
	//split input string and show url
	var url = "https://www.googleapis.com/books/v1/volumes?q=intitle:" 
	var str = element;
	var res = str.split(" ");
	for (i=0; i < res.length; i++) {	
		console.log(res[i]);
		url+= res[i] + "+"; 
	}
	
	//redirect to search items
	$.get(url, function(data) {
		var items = data.items;
		$("#listy").empty("");
		for (i=0; i< items.length; i++) {
			//var urlThing = '<li><a href="' + url + '">' + items[i].volumeInfo.title + '</a></li>'
			var urlForEach = url + items[i].id;
			var imgLink = items[i].volumeInfo.imageLinks.thumbnail;
			var urlThing = '<li>'  +
			 '<img src="'+ imgLink + 
			 '">' + '<h3>' + items[i].volumeInfo.title + '</h3>' + "<i>" + 
			 items[i].volumeInfo.authors + '</i><p>' + items[i].volumeInfo.description  +'</p></li>';
			
			$("#listy").append(urlThing);
			console.log("URL" + items[i].volumeInfo.imageLinks.thumbnail); 
			console.log(items[i].volumeInfo);

			$("#listy").listview();
			$("#listy").listview("refresh");
		}
		
	});
}
