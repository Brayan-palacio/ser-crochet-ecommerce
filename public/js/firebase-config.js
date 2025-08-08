// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBxf1CcF0Esl0BsDtpsDiodTX3XTMZZFlg",
  authDomain: "ser-crochet.firebaseapp.com",
  projectId: "ser-crochet",
  storageBucket: "ser-crochet.appspot.com",
  messagingSenderId: "527639236941",
  appId: "1:527639236941:web:d27ad0ef334d570e93a704"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();