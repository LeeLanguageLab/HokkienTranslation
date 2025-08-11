import os
import numpy as np
import librosa
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import matplotlib.pyplot as plt

# -------- SETTINGS --------
DATASET_PATH = '../speechData'
SAMPLE_RATE = 16000
NOISE_LEVEL = 0.005
AUGMENT_NOISE = True  # Set True to double data with noise
N_MFCC_LIST = [30, 40, 50, 60, 70, 80]
# N_MFCC_LIST = [35, 37, 40, 42, 45, 47, 50]
CLASSIFIERS = {
    'SVC': SVC(kernel='linear'),
    'KNN': KNeighborsClassifier(n_neighbors=3),
    'MLP': MLPClassifier(hidden_layer_sizes=(100,), max_iter=300)
}
# --------------------------

def extract_mfcc(file_path, n_mfcc, add_noise=False):
    y, sr = librosa.load(file_path, sr=SAMPLE_RATE)
    if add_noise:
        noise = np.random.randn(len(y))
        y = y + NOISE_LEVEL * noise
        y = np.clip(y, -1.0, 1.0)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    return np.mean(mfcc.T, axis=0)

def load_dataset(dataset_dir, n_mfcc, augment=False):
    X, y = [], []
    for deck in os.listdir(dataset_dir):
        deck_path = os.path.join(dataset_dir, deck)
        if not os.path.isdir(deck_path): continue
        for card in os.listdir(deck_path):
            card_path = os.path.join(deck_path, card)
            if not os.path.isdir(card_path): continue
            label = card
            for file in os.listdir(card_path):
                if not file.endswith(".wav"): continue
                file_path = os.path.join(card_path, file)
                try:
                    X.append(extract_mfcc(file_path, n_mfcc, add_noise=False))
                    y.append(label)
                    if augment:
                        X.append(extract_mfcc(file_path, n_mfcc, add_noise=True))
                        y.append(label)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
    return np.array(X), np.array(y)

def train_and_eval(model, X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    return accuracy_score(y_test, y_pred)

def main():
    results = {model_name: [] for model_name in CLASSIFIERS.keys()}

    for n_mfcc in N_MFCC_LIST:
        print(f"\n📊 Testing n_mfcc = {n_mfcc}")
        X, y = load_dataset(DATASET_PATH, n_mfcc=n_mfcc, augment=AUGMENT_NOISE)
        for model_name, model in CLASSIFIERS.items():
            print(f"  🔧 Training {model_name}...")
            acc = train_and_eval(model, X, y)
            print(f"  ✅ {model_name} Accuracy: {acc:.2%}")
            results[model_name].append(acc)

    # Plotting
    plt.figure(figsize=(10, 6))
    for model_name, acc_list in results.items():
        plt.plot(N_MFCC_LIST, acc_list, marker='o', label=model_name)
    plt.title("Accuracy vs. Number of MFCCs")
    plt.xlabel("n_mfcc")
    plt.ylabel("Accuracy")
    plt.grid(True)
    plt.legend()
    plt.ylim(0, 1)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    main()
