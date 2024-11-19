const { DateTime } = require('luxon');
const performCRUD = require('./../dataBase/operation');



const getCurrentDay = () => {
    return DateTime.now().setZone('Asia/Tehran').toFormat('ccc').toLowerCase(); // مثال: "sat", "mon"
};


async function isHoliday(date) {
    const condition = { holiday_date: date }; // تبدیل تاریخ به فرمت YYYY-MM-DD
    try {
        const holidays = await performCRUD('select', 'holidays', condition);
        return holidays.length > 0; // اگر تعطیل بود، true برمی‌گرداند
    } catch (err) {
        console.error('خطا در بررسی تعطیلات:', err);
        return false;
    }
}


async function checkSchedules(io) {
    setInterval(async () => {
        const now = new Date().toLocaleDateString('fa-IR-u-nu-latn');
        const currentDay = getCurrentDay();
        try {
            // بررسی تعطیل بودن روز

            const holiday = await isHoliday(now);
            // console.log()
            if (holiday) {
                console.log(`روز ${now} تعطیل است. فرمانی ارسال نمی‌شود.`);
                return;
            }

            // دریافت بازه‌های روز فعلی از دیتابیس
            const condition = { day: currentDay };
            const timeRanges = await performCRUD('select', 'schedule', condition);

            if (!timeRanges.length) {
                console.log(`هیچ بازه‌ای برای روز ${currentDay} پیدا نشد.`);
                return;
            }

            timeRanges.forEach((range) => {
                const startTime = now.set({
                    hour: range.start_hour,
                    minute: range.start_min,
                    second: 0,
                    millisecond: 0,
                });
                const stopTime = now.set({
                    hour: range.stop_hour,
                    minute: range.stop_min,
                    second: 0,
                    millisecond: 0,
                });

                // بررسی زمان شروع
                if (now.hasSame(startTime, 'minute')) {
                    console.log(`ارسال فرمان روشن شدن برای بازه ${range.id}`);
                    io.emit('command', { type: 'ON', rangeId: range.id });
                }

                // بررسی زمان پایان
                if (now.hasSame(stopTime, 'minute')) {
                    console.log(`ارسال فرمان خاموش شدن برای بازه ${range.id}`);
                    io.emit('command', { type: 'OFF', rangeId: range.id });
                }
            });
        } catch (err) {
            console.error('خطا در بررسی زمان‌بندی‌ها:', err);
        }
    }, 6 * 1000); // بررسی هر دقیقه
}


module.exports = checkSchedules;