// 模型URL
const URL = "https://teachablemachine.withgoogle.com/models/_bTggKS0d/";

// 全局變量
let model, webcam, labelContainer, maxPredictions;
let modelLoaded = false;

// 載入模型函數
async function loadModel() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        modelLoaded = true;
    } catch (error) {
        console.error('模型載入出錯:', error);
        alert('模型載入失敗，請重新整理頁面重試。');
    }
}

// 標籤頁切換功能
function switchTab(tabName) {
    // 隱藏所有標籤頁內容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 移除所有標籤按鈕的啟用狀態
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // 顯示選中的標籤頁
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // 啟用對應的標籤按鈕
    event.target.classList.add('active');

    // 如果切換到上傳標籤頁，停止攝像頭
    if (tabName === 'upload' && webcam) {
        webcam.stop();
    }
}

// 初始化函數
async function init() {
    try {
        // 如果模型未載入，先載入模型
        if (!modelLoaded) {
            await loadModel();
        }
        
        // 如果已經存在攝像頭實例，先停止並清理
        if (webcam) {
            webcam.stop();
            const stream = webcam.webcam.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }

        // 清空容器
        const webcamContainer = document.getElementById("webcam-container");
        labelContainer = document.getElementById("label-container");
        webcamContainer.innerHTML = '';
        labelContainer.innerHTML = '';

        // 設置網路攝像頭參數
        const flip = true;
        const width = 400;  // 增加預設寬度
        const height = 400; // 增加預設高度

        // 初始化新的網路攝像頭
        webcam = new tmImage.Webcam(width, height, flip);
        await webcam.setup();
        await webcam.play();

        // 確保容器是空的，然後添加新的攝像頭畫布
        webcamContainer.innerHTML = '';
        webcamContainer.appendChild(webcam.canvas);

        // 開始預測循環
        window.requestAnimationFrame(loop);

    } catch (error) {
        console.error('攝像頭訪問出錯:', error);
        alert('無法訪問攝像頭，請確保已授予攝像頭訪問權限。');
    }
}

// 預測循環函數
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// 預測函數
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    // 確保 labelContainer 存在
    if (!labelContainer) {
        labelContainer = document.getElementById("label-container");
    }
    
    // 清空標籤容器
    labelContainer.innerHTML = '';
    
    // 添加符號顯示
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-symbol';
    
    // 如果第一個類別的概率更大，顯示 O，否則顯示 X
    if (prediction[0].probability > prediction[1].probability) {
        resultDiv.textContent = 'O';
        resultDiv.classList.add('result-o');
    } else {
        resultDiv.textContent = 'X';
        resultDiv.classList.add('result-x');
    }
    
    labelContainer.appendChild(resultDiv);
    
    // 顯示具體概率
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        const div = document.createElement('div');
        div.innerHTML = classPrediction;
        labelContainer.appendChild(div);
    }
}

// 圖片上傳處理函數
async function handleImageUpload(event) {
    try {
        // 顯示載入提示
        const uploadLabelContainer = document.getElementById('upload-label-container');
        uploadLabelContainer.innerHTML = '模型載入中，請稍候...';
        
        // 確保模型載入
        if (!modelLoaded) {
            await loadModel();
        }
        
        if (!model) {
            throw new Error('模型載入失敗');
        }

        const file = event.target.files[0];
        if (!file) {
            throw new Error('未選擇檔案');
        }

        const imageElement = document.createElement('img');
        const reader = new FileReader();

        // 使用 Promise 包裝 FileReader
        const imageLoadPromise = new Promise((resolve, reject) => {
            reader.onload = function(e) {
                imageElement.src = e.target.result;
                imageElement.onload = resolve;
                imageElement.onerror = () => reject(new Error('圖片載入失敗'));
            };
            reader.onerror = () => reject(new Error('檔案讀取失敗'));
        });

        // 開始讀取檔案
        reader.readAsDataURL(file);
        
        // 設置預覽容器和圖片的樣式
        const previewContainer = document.getElementById('preview-container');
        previewContainer.style.display = 'flex';
        previewContainer.style.justifyContent = 'center';
        previewContainer.style.alignItems = 'center';
        previewContainer.style.margin = '15px auto';
        previewContainer.style.width = '100%';
        
        // 設置圖片樣式
        imageElement.style.width = '90%';
        imageElement.style.maxWidth = '800px';
        imageElement.style.height = 'auto';
        imageElement.style.borderRadius = '12px';
        imageElement.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.3)';
        
        previewContainer.innerHTML = '';
        previewContainer.appendChild(imageElement);
        
        // 等待圖片載入完成
        await imageLoadPromise;
        
        // 進行預測
        const predictions = await model.predict(imageElement);
        
        uploadLabelContainer.innerHTML = '';
        uploadLabelContainer.style.textAlign = 'center';
        
        // 顯示預測結果
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-symbol';
        
        if (predictions[0].probability > predictions[1].probability) {
            resultDiv.textContent = 'O';
            resultDiv.classList.add('result-o');
        } else {
            resultDiv.textContent = 'X';
            resultDiv.classList.add('result-x');
        }
        
        uploadLabelContainer.appendChild(resultDiv);
        
        // 顯示具體概率
        predictions.forEach(prediction => {
            const div = document.createElement('div');
            div.innerHTML = `${prediction.className}: ${prediction.probability.toFixed(2)}`;
            div.style.textAlign = 'center';
            uploadLabelContainer.appendChild(div);
        });
    } catch (error) {
        console.error('預測出錯:', error);
        const uploadLabelContainer = document.getElementById('upload-label-container');
        uploadLabelContainer.innerHTML = `預測失敗: ${error.message}`;
    }
} 