import { useEffect } from "react";
import updateFlashcards from "./addImageAndContextToFlashcards";




const imageContextScriptComponent = () => {
    useEffect(() => {
        updateFlashcards();
    }    
    );

    return (
        <div>
            <h1>Image Context Script Component</h1>
        </div>
    )
}

export default imageContextScriptComponent;