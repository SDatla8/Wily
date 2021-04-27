import firebase from "firebase";
require("@firebase/firestore");

var firebaseConfig = {
  apiKey: "AIzaSyAoBZhhkeWnfC4UZAYSSRASJ8VWx730HHc",
  authDomain: "library-76e05.firebaseapp.com",
  projectId: "library-76e05",
  storageBucket: "library-76e05.appspot.com",
  messagingSenderId: "397291601585",
  appId: "1:397291601585:web:1508b6866f94a0b81cec90",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
