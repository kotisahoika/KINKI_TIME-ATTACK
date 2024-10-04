// Firebaseの設定
const firebaseConfig = {
    apiKey: "AIzaSyAMIzeUflokGll6FdI7dELPQfEdUypUpy8",
    authDomain: "kinki-time-attack.firebaseapp.com",
    projectId: "kinki-time-attack",
    storageBucket: "kinki-time-attack.appspot.com",
    messagingSenderId: "332441960196",
    appId: "1:332441960196:web:3dfb392780560683fa1a51"
};

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// グローバル変数
let currentTeam = null;
let endTime = null;

// DOMの要素を取得
const loginSection = document.getElementById('login-section');
const scoreboard = document.getElementById('scoreboard');
const teamA_ScoreElement = document.getElementById('teamA-score');
const teamB_ScoreElement = document.getElementById('teamB-score');
const remainingTimeElement = document.getElementById('remaining-time');

// ログインボタンのクリックイベント
document.getElementById('login-btn').addEventListener('click', async () => {
    const teamName = document.getElementById('team-name').value.trim();
    const password = document.getElementById('password').value;

    // チーム名が正しいか確認
    if (teamName !== 'A' && teamName !== 'B') {
        alert('チーム名はAまたはBでなければなりません。');
        return;
    }

    const teamDoc = await db.collection('teams').doc(`team${teamName}`).get();

    // パスワードの確認
    if (teamDoc.exists && teamDoc.data().password === password) {
        currentTeam = teamName;
        alert(`${teamName}チームとしてログインしました。`);
        loginSection.style.display = 'none';
        scoreboard.style.display = 'block';

        // スコアを表示
        updateScores();
        startCountdown();
    } else {
        alert('パスワードが間違っています。');
    }
});

// チェックインボタンのクリックイベント
document.getElementById('checkin-btn').addEventListener('click', async () => {
    if (!currentTeam) return;

    if (!navigator.geolocation) {
        alert('このブラウザは位置情報をサポートしていません。');
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const checkInLocation = getCheckInLocation(latitude, longitude);

        if (checkInLocation) {
            await db.collection('teams').doc(`team${currentTeam}`).update({
                score: firebase.firestore.FieldValue.increment(checkInLocation.score),
                checkIns: firebase.firestore.FieldValue.arrayUnion({
                    location: checkInLocation.name,
                    time: new Date().toISOString()
                })
            });
            alert(`${checkInLocation.name}にチェックインしました。`);
            updateScores();
        } else {
            alert('近畿地方の県庁または府庁の近くにいません。');
        }
    });
});

// チームのスコアを更新する関数
async function updateScores() {
    const teamA = await db.collection('teams').doc('teamA').get();
    const teamB = await db.collection('teams').doc('teamB').get();
    teamA_ScoreElement.textContent = `チームA得点: ${teamA.data().score}`;
    teamB_ScoreElement.textContent = `チームB得点: ${teamB.data().score}`;
}

// 残り時間をカウントダウンする関数
function startCountdown() {
    // 終了時刻を設定（1時間後）
    endTime = Date.now() + 3600000; // 3600000ms = 1時間

    const countdown = setInterval(() => {
        const now = Date.now();
        const remainingTime = endTime - now;

        if (remainingTime <= 0) {
            clearInterval(countdown);
            remainingTimeElement.textContent = '残り時間: 0秒';
            alert('時間切れです！');
            return;
        }

        const seconds = Math.floor((remainingTime / 1000) % 60);
        const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
        const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);

        remainingTimeElement.textContent = `残り時間: ${hours}時間 ${minutes}分 ${seconds}秒`;
    }, 1000);
}

// チェックインの場所を取得する関数
function getCheckInLocation(latitude, longitude) {
    const kinkiLocations = [
        { name: "大阪府庁", latitude: 34.6863, longitude: 135.5259, score: 100 },
        { name: "京都府庁", latitude: 35.0116, longitude: 135.7681, score: 100 },
        { name: "兵庫県庁", latitude: 34.6913, longitude: 135.1830, score: 100 },
        { name: "滋賀県庁", latitude: 35.0043, longitude: 135.8680, score: 100 },
        { name: "奈良県庁", latitude: 34.6851, longitude: 135.8047, score: 150 },
        { name: "和歌山県庁", latitude: 33.6220, longitude: 135.5000, score: 150 },
        { name: "三重県庁", latitude: 34.7303, longitude: 136.5102, score: 250 }
    ];

    for (const location of kinkiLocations) {
        const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
        if (distance <= 0.1) { // 100m以内でチェックイン
            return location; // チェックインした場所を返す
        }
    }
    return null; // 近畿地方の県庁でない場合
}

// 2点間の距離を計算する関数（単位: km）
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球の半径 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 距離を返す
}
