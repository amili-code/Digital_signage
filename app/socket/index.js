const performCRUD = require('./../dataBase/operation');
const checkSchedules = require('./scheduling')
const socketIo = require('socket.io');
const { DateTime } = require('luxon');
require('dotenv').config();
let connectedClients = {};

// مدیریت اتصال‌های سوکت
function setupSocket(server) {
    const io = socketIo(server);

    io.on('connection', (socket) => {
        console.log('کاربر جدید متصل شد:', socket.id);

        socket.on('starter', async (json) => {
            console.log(`${json.mac} به سرور متصل شد`);

            try {
                const condition = { mac: json.mac };
                const data = { connection: 1 };
                await performCRUD('update', 'player', condition, data);
                connectedClients[json.mac] = socket.id;

                const playerData = await performCRUD('select', 'player', condition);
                console.log('اطلاعات پلیر:', playerData[0]);
            } catch (err) {
                console.error('خطا در مدیریت starter:', err);
            }
        });

        socket.on('getVideo', async (mac) => {
            try {
                const allVideos = await allVideos();
                const videoArray = await videoPlayer(mac.toString());

                let videoList = [];
                allVideos.forEach((vid) => videoList.push(vid.name));
                videoArray.forEach((vid) => videoList.push(vid.videoName));

                console.log('لیست ویدیوها:', videoList);
            } catch (err) {
                console.error('خطا در دریافت ویدیوها:', err);
            }
        });

        socket.on('getOnlineClients', () => {
            const macList = Object.keys(connectedClients);
            console.log('لیست کلاینت‌های آنلاین:', macList);
        });

        socket.on('disconnect', async () => {
            for (const mac in connectedClients) {
                if (connectedClients[mac] === socket.id) {
                    console.log(`${mac} قطع اتصال شد`);

                    try {
                        const condition = { mac };
                        const data = { connection: 0 };
                        await performCRUD('update', 'player', condition, data);
                        delete connectedClients[mac];
                    } catch (err) {
                        console.error('خطا در مدیریت قطع اتصال:', err);
                    }
                    break;
                }
            }
        });
    });

    checkSchedules(io);
    return io;
}

// دریافت لیست ویدیوها برای پلیر
async function videoPlayer(mac) {
    const condition = { playerMac: mac };
    return await performCRUD('select', 'video_list', condition);
}

// دریافت تمام ویدیوهای موجود
async function allVideos() {
    const condition = { disable: 1 };
    return await performCRUD('select', 'video', condition);
}

module.exports = setupSocket;
