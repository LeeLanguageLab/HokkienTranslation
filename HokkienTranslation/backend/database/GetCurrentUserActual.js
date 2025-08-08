import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Firebase";
const getCurrentUserActual = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          resolve(null);
        }
      },
      reject
    );
  });
};
export default getCurrentUserActual;
