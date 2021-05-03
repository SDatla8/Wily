import React, { Component } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ImageBackground,
  Image,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from "../config";
const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");
import firebase from "firebase";
export default class TransactionScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookId: "",
      studentId: "",
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false,
    };
  }

  getCameraPermissions = async (domState) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      hasCameraPermissions: status === "granted",
      domState: domState,
      scanned: false,
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { domState } = this.state;

    if (domState === "bookId") {
      this.setState({
        bookId: data,
        domState: "normal",
        scanned: true,
      });
    } else if (domState === "studentId") {
      this.setState({
        studentId: data,
        domState: "normal",
        scanned: true,
      });
    }
  };
  handleTransaction = async () => {
    var transactiontype = await this.checkbookelegibility();
    console.log(transactiontype);
    if (!transactiontype) {
      Alert.alert("The Book does not exist. Please try contacting the owner");
      this.setState({
        bookId: "",
        studentId: "",
      });
    } else if (transactiontype === "issue") {
      var isstudenteligible = await this.checkstudenteligibilityforissue();
      if (isstudenteligible) {
        this.initiatebookissue();
        Alert.alert("Book Issued to Student");
      }
    } else {
      var isstudenteligible = await this.checkstudenteligibilityforreturn();
      if (isstudenteligible) {
        this.initiatebookreturn();
        Alert.alert("Book issued to Library");
      }
    }
    // db.collection("books")
    //   .doc(this.state.bookId)
    //   .get()
    //   .then((doc) => {
    //     var book = doc.data();
    //     console.log(book.bookavailability);
    //     if (book.bookavailability) {
    //       this.initiatebookissue();
    //     } else {
    //       this.initiatebookreturn();
    //     }
    //   });
  };
  initiatebookissue = async () => {
    db.collection("transactions").add({
      studentId: this.state.studentId,
      bookId: this.state.bookId,
      transactiontype: "issue",
      date: firebase.firestore.Timestamp.now().toDate(),
    });
    db.collection("books").doc(this.state.bookId).update({
      bookavailability: false,
    });
    db.collection("students")
      .doc(this.state.studentId)
      .update({
        bookstaken: firebase.firestore.FieldValue.increment(1),
      });
    Alert.alert("book successfully issued");
  };
  initiatebookreturn = async () => {
    db.collection("transactions").add({
      studentId: this.state.studentId,
      bookId: this.state.bookId,
      transactiontype: "return",
      date: firebase.firestore.Timestamp.now().toDate(),
    });
    db.collection("books").doc(this.state.bookId).update({
      bookavailability: true,
    });
    db.collection("students")
      .doc(this.state.studentId)
      .update({
        bookstaken: firebase.firestore.FieldValue.increment(-1),
      });
    Alert.alert("book successfully returned");
  };
  checkbookelegibility = async () => {
    const bookref = await db
      .collection("books")
      .where("bookId", "==", this.state.bookId)
      .get();
    var transactiontype = "";
    if (bookref.docs.length == 0) {
      this.setState({
        bookId: "",
        studentId: "",
      });
      transactiontype = false;
      Alert.alert("Book Not Found");
    } else {
      bookref.docs.map((doc) => {
        var book = doc.data();
        if (book.bookavailability) {
          transactiontype = "issue";
        } else {
          transactiontype = "return";
        }
      });
    }
  };
  checkstudenteligibilityforissue = async () => {
    const studentref = await db
      .collection("students")
      .where("studentId", "==", this.state.studentId)
      .get();
    var isstudenteligible = "";
    if (studentref.docs.length == 0) {
      isstudenteligible = "false";
      Alert.alert("Student Does not Exist");
    } else {
      studentref.docs.map((doc) => {
        var student = doc.data();
        if (student.bookstaken < 2) {
          isstudenteligible = true;
        } else {
          isstudenteligible = false;
          Alert.alert("Student has reached the limit for books issued");
        }
      });
    }
    return isstudenteligible;
  };
  checkstudenteligibilityforreturn = async () => {
    const transactionref = await db
      .collection("transactions")
      .where("bookId", "==", this.state.bookId)
      .limit(1)
      .get();
    var isstudenteligible = "";
    transactionref.docs.map((doc) => {
      var lastbooktransaction = doc.data();
      if (lastbooktransaction.studentId === this.state.studentId) {
        isstudenteligible = true;
      } else {
        isstudenteligible = false;
        Alert(" This boook is not issued by this student");
      }
    });
    return isstudenteligible;
  };
  render() {
    const { bookId, studentId, domState, scanned } = this.state;
    if (domState !== "normal") {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        <View style={styles.container}>
          <ImageBackground source={bgImage} style={styles.bgImage}>
            <View style={styles.upperContainer}>
              <Image source={appIcon} style={styles.appIcon} />
              <Image source={appName} style={styles.appName} />
            </View>
            <View style={styles.lowerContainer}>
              <View style={styles.textinputContainer}>
                <TextInput
                  style={styles.textinput}
                  placeholder={"Book Id"}
                  placeholderTextColor={"#FFFFFF"}
                  value={bookId}
                  onChangeText={(text) => {
                    this.setState({ bookId: text });
                  }}
                />
                <TouchableOpacity
                  style={styles.scanbutton}
                  onPress={() => this.getCameraPermissions("bookId")}
                >
                  <Text style={styles.scanbuttonText}>Scan</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.textinputContainer, { marginTop: 25 }]}>
                <TextInput
                  style={styles.textinput}
                  placeholder={"Student Id"}
                  placeholderTextColor={"#FFFFFF"}
                  value={studentId}
                  onChangeText={(text) => {
                    this.setState({ studentId: text });
                  }}
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.scanbutton}
                  onPress={() => this.getCameraPermissions("studentId")}
                >
                  <Text style={styles.scanbuttonText}>Scan</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={{
                width: 100,
                height: 30,
                backgroundColor: "aqua",
                justifyContent: "center",
                alignContent: "center",
                alignItems: "center",
                alignSelf: "center",
              }}
              onPress={this.handleTransaction}
            >
              <Text>Submit</Text>
            </TouchableOpacity>
          </ImageBackground>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80,
  },
  appName: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: "center",
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF",
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    fontFamily: "Rajdhani_600SemiBold",
    color: "#FFFFFF",
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scanbuttonText: {
    fontSize: 24,
    color: "#0A0101",
    fontFamily: "Rajdhani_600SemiBold",
  },
});
