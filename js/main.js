// 模型 URL
const URL = "https://teachablemachine.withgoogle.com/models/_bTggKS0d/";

// 全域變數
let model, webcam, labelContainer, maxPredictions;
let modelLoaded = false;

// 載入模型
async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    modelLoaded = true;

    return model;
}

async function init() {
    try {
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = "模型載入中，請稍候...";

        if (!modelLoaded) {
            await loadModel();
        }

        if (!model) {
            throw new Error("模型載入失敗");
        }

        // 設置網路攝影機
        const flip = true;
        webcam = new tmImage.Webcam(400, 400, flip);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loop);

        // 將網路攝影機元素附加到 DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        
        // 設置標籤容器
        labelContainer.innerHTML = "";
        
        // 創建預測結果的 div
        const resultDiv = document.createElement("div");
        resultDiv.className = "result-symbol";
        labelContainer.appendChild(resultDiv);
        
        // 創建概率顯示的 div
        for (let i = 0; i < maxPredictions; i++) {
            const div = document.createElement("div");
            labelContainer.appendChild(div);
        }
    } catch (error) {
        console.error("初始化錯誤:", error);
        labelContainer.innerHTML = `初始化失敗: ${error.message}`;
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    try {
        const predictions = await model.predict(webcam.canvas);
        
        // 更新結果符號
        const resultDiv = labelContainer.children[0];
        if (predictions[0].probability > predictions[1].probability) {
            resultDiv.textContent = "O";
            resultDiv.className = "result-symbol result-o";
        } else {
            resultDiv.textContent = "X";
            resultDiv.className = "result-symbol result-x";
        }
        
        // 更新概率
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction = predictions[i].className + ": " + predictions[i].probability.toFixed(2);
            labelContainer.children[i + 1].innerHTML = classPrediction;
        }
    } catch (error) {
        console.error("預測錯誤:", error);
    }
} 