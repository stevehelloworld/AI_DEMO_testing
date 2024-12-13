// 模型URL
const URL = "https://teachablemachine.withgoogle.com/models/_bTggKS0d/";

// 全局变量
let model, webcam, labelContainer, maxPredictions;
let modelLoaded = false;

// 加载模型函数
async function loadModel() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        modelLoaded = true;
    } catch (error) {
        console.error('模型加载出错:', error);
        alert('模型加载失败，请刷新页面重试。');
    }
}

// 标签页切换功能
function switchTab(tabName) {
    // 隐藏所有标签页内容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 移除所有标签按钮的激活状态
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // 显示选中的标签页
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // 激活对应的标签按钮
    event.target.classList.add('active');

    // 如果切换到上传标签页，停止摄像头
    if (tabName === 'upload' && webcam) {
        webcam.stop();
    }
}

// 初始化函数
async function init() {
    try {
        // 如果模型未加载，先加载模型
        if (!modelLoaded) {
            await loadModel();
        }
        
        // 如果已经存在摄像头实例，先停止并清理
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

        // 设置网络摄像头参数
        const flip = true;
        const width = 400;  // 增加默认宽度
        const height = 400; // 增加默认高度

        // 初始化新的网络摄像头
        webcam = new tmImage.Webcam(width, height, flip);
        await webcam.setup();
        await webcam.play();

        // 确保容器是空的，然后添加新的摄像头画布
        webcamContainer.innerHTML = '';
        webcamContainer.appendChild(webcam.canvas);

        // 开始预测循环
        window.requestAnimationFrame(loop);

    } catch (error) {
        console.error('摄像头访问出错:', error);
        alert('无法访问摄像头，请确保已授予摄像头访问权限。');
    }
}

// 预测循环函数
async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// 预测函数
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    // 确保 labelContainer 存在
    if (!labelContainer) {
        labelContainer = document.getElementById("label-container");
    }
    
    // 清空标签容器
    labelContainer.innerHTML = '';
    
    // 添加符号显示
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-symbol';
    
    // 如果第一个类别的概率更大，显示 O，否则显示 X
    if (prediction[0].probability > prediction[1].probability) {
        resultDiv.textContent = 'O';
        resultDiv.classList.add('result-o');
    } else {
        resultDiv.textContent = 'X';
        resultDiv.classList.add('result-x');
    }
    
    labelContainer.appendChild(resultDiv);
    
    // 显示具体概率
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        const div = document.createElement('div');
        div.innerHTML = classPrediction;
        labelContainer.appendChild(div);
    }
}

// 图片上传处理函数
async function handleImageUpload(event) {
    try {
        // 显示加载提示
        const uploadLabelContainer = document.getElementById('upload-label-container');
        uploadLabelContainer.innerHTML = '模型加载中，请稍候...';
        
        // 确保模型加载
        if (!modelLoaded) {
            await loadModel();
        }
        
        if (!model) {
            throw new Error('模型加载失败');
        }

        const file = event.target.files[0];
        if (!file) {
            throw new Error('未选择文件');
        }

        const imageElement = document.createElement('img');
        imageElement.src = URL.createObjectURL(file);
        
        // 设置预览容器和图片的样式
        const previewContainer = document.getElementById('preview-container');
        previewContainer.style.display = 'flex';
        previewContainer.style.justifyContent = 'center';
        previewContainer.style.alignItems = 'center';
        previewContainer.style.margin = '15px auto';
        previewContainer.style.width = '100%';
        
        // 设置图片样式
        imageElement.style.width = '90%';
        imageElement.style.maxWidth = '800px';
        imageElement.style.height = 'auto';
        imageElement.style.borderRadius = '12px';
        imageElement.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.3)';
        
        previewContainer.innerHTML = '';
        previewContainer.appendChild(imageElement);
        
        // 等待图片加载
        await new Promise((resolve, reject) => {
            imageElement.onload = resolve;
            imageElement.onerror = () => reject(new Error('图片加载失败'));
        });
        
        // 进行预测
        const predictions = await model.predict(imageElement);
        
        uploadLabelContainer.innerHTML = '';
        uploadLabelContainer.style.textAlign = 'center';
        
        // 显示预测结果
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
        
        // 显示具体概率
        predictions.forEach(prediction => {
            const div = document.createElement('div');
            div.innerHTML = `${prediction.className}: ${prediction.probability.toFixed(2)}`;
            div.style.textAlign = 'center';
            uploadLabelContainer.appendChild(div);
        });
    } catch (error) {
        console.error('预测出错:', error);
        const uploadLabelContainer = document.getElementById('upload-label-container');
        uploadLabelContainer.innerHTML = `预测失败: ${error.message}`;
    }
} 