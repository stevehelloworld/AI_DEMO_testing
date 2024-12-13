// 模型URL
const URL = "https://teachablemachine.withgoogle.com/models/_bTggKS0d/";

// 全局变量
let model, webcam, labelContainer, maxPredictions;

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
        // ... init函数的完整代码 ...
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
    // ... predict函数的完整代码 ...
}

// 图片上传处理函数
async function handleImageUpload(event) {
    // ... handleImageUpload函数的完整代码 ...
} 