# HokkienTranslation
### Website: [hokkien-translation.netlify.app](https://hokkien-translation.netlify.app)

We have published 2 papers at NAACL 2025 (System Demo Track)!

[ATAIGI: An AI-Powered Multimodal Learning App Leveraging Generative Models for Low-Resource Taiwanese Hokkien](https://aclanthology.org/2025.naacl-demo.2/) <br>
Yun-Hsin Chu, Shuai Zhu, Shou-Yi Hung, Bo-Ting Lin, En-Shiun Annie Lee, Richard Tzong-Han Tsai

[Learning Low-Resource Languages Through NLP-Driven Flashcards: A Case Study of Hokkien in Language Learning Applications](https://aclanthology.org/2025.naacl-demo.26/) <br>
Tai Zhang, Lucie Yang, Erin Chen, Karen Riani, Jessica Zipf, Mariana Shimabukuro, En-Shiun Annie Lee

## Setup Guide 

This guide provides instructions on how to set up and deploy the `HokkienTranslation` project.

### Prerequisites

Before you begin, make sure that `npm` and `expo-cli` is installed on your system. If you do not have `npm`, please install it from [npm's official website](https://www.npmjs.com/get-npm).
If you do not have `expo-cli` run the following command to install:
    ```
    npm install -g expo-cli
    ```

### Installation

1. Navigate to the `HokkienTranslation` project directory.
2. Run the following command to install all necessary dependencies:

   ```
   npm install
   ```

### Running the Project

- To start the project on your local machine, run:

  ```
  npm run start
  ```

- To run the project in a web environment, use:

  ```
  npm run web
  ```

<!-- ## Deployment

To deploy the `HokkienTranslation` project to Vercel, follow these steps:

1. Build the project for production by running:

   ```
   expo-cli build:web
   ```
   
2. Navigate to the web-build folder:

   ```
   cd web-build
   ```
   
3. Deploy the build to Vercel using the `vercel` command:

   ```
   vercel
   ```

For more detailed information on publishing websites, refer to the [Expo documentation on publishing websites](https://docs.expo.dev/distribution/publishing-websites/).
-->


## Citation

If you find this implementation useful in your works, please acknowledge it
appropriately by citing:

```
@inproceedings{chu-etal-2025-ataigi,
    title = "{ATAIGI}: An {AI}-Powered Multimodal Learning App Leveraging Generative Models for Low-Resource {T}aiwanese Hokkien",
    author = "Chu, Yun-Hsin and Zhu, Shuai and Hung, Shou-Yi and Lin, Bo-Ting and Lee, En-Shiun Annie and Tsai, Richard Tzong-Han",
    booktitle = "Proceedings of the 2025 Conference of the Nations of the Americas Chapter of the Association for Computational Linguistics: Human Language Technologies (System Demonstrations)",
    year = "2025",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2025.naacl-demo.2/",
}
```

```
@inproceedings{zhang-etal-2025-learning,
    title = "Learning Low-Resource Languages Through {NLP}-Driven {F}lashcards: A Case Study of Hokkien in Language Learning Applications",
    author = "Zhang, Tai and Yang, Lucie and Chen, Erin and Riani, Karen and Zipf, Jessica and Shimabukuro, Mariana and Lee, En-Shiun Annie",
    booktitle = "Proceedings of the 2025 Conference of the Nations of the Americas Chapter of the Association for Computational Linguistics: Human Language Technologies (System Demonstrations)",
    year = "2025",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2025.naacl-demo.26/",
}
```
