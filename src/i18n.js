/**
 * Internationalization (i18n) Module
 * Centralized multi-language translations for Persian (fa), English (en), and Arabic (ar)
 */

const LANGUAGES = {
  fa: "فارسی",
  en: "English",
  ar: "العربية",
};

const translations = {
  // Language Selection
  lang_select_prompt: {
    fa: "🌍 <b>زبان خود را انتخاب کنید:</b>",
    en: "🌍 <b>Select your language:</b>",
    ar: "🌍 <b>اختر لغتك:</b>",
  },

  // Admin Workflow - Messages
  admin_new_movie_title: {
    fa: "<b>🎬 آپ لود فیلم جدید</b>\n\nلطفاً عنوان فیلم را وارد کنید:",
    en: "<b>🎬 New Movie Upload</b>\n\nPlease enter the movie title:",
    ar: "<b>🎬 رفع فيلم جديد</b>\n\nيرجى إدخال عنوان الفيلم:",
  },

  admin_title_invalid: {
    fa: "⚠️ عنوان باید بین 2-100 کاراکتر باشد. لطفاً دوباره تلاش کنید:",
    en: "⚠️ Title must be between 2-100 characters. Please try again:",
    ar: "⚠️ يجب أن يكون العنوان بين 2-100 حرف. يرجى المحاولة مرة أخرى:",
  },

  admin_title_saved: {
    fa: "<b>✅ عنوان ذخیره شد:</b> <code>{title}</code>\n\n📸 اکنون لطفاً عکس بنر فیلم را ارسال کنید:",
    en: "<b>✅ Title saved:</b> <code>{title}</code>\n\n📸 Now please send the movie banner image:",
    ar: "<b>✅ تم حفظ العنوان:</b> <code>{title}</code>\n\n📸 الآن يرجى إرسال صورة لافتة الفيلم:",
  },

  admin_banner_saved: {
    fa: "<b>✅ بنر ذخیره شد!</b>\n\n📹 اکنون لطفاً فیلم‌های ویدیویی را به طور متوالی ارسال کنید.\n\n<i>هر فایل ویدیویی را یکی یکی ارسال کنید. پس از آپ لود کردن تمام ویدیوها، از دستور /finish استفاده کنید.</i>",
    en: "<b>✅ Banner saved!</b>\n\n📹 Now please send the video files sequentially.\n\n<i>Send each video file one by one. After uploading all videos, use /finish command.</i>",
    ar: "<b>✅ تم حفظ اللافتة!</b>\n\n📹 الآن يرجى إرسال ملفات الفيديو بالتسلسل.\n\n<i>أرسل كل ملف فيديو واحداً تلو الآخر. بعد تحميل جميع مقاطع الفيديو، استخدم الأمر /finish.</i>",
  },

  admin_video_saved: {
    fa: "<b>✅ ویدیو {index} ذخیره شد</b>\n📊 کیفیت تشخیص: <code>{quality}p</code>\n\n📹 ویدیوی بعدی را ارسال کنید یا از <code>/finish</code> برای اتمام آپ لود استفاده کنید.",
    en: "<b>✅ Video {index} saved</b>\n📊 Quality detected: <code>{quality}p</code>\n\n📹 Send the next video or use <code>/finish</code> to complete upload.",
    ar: "<b>✅ تم حفظ الفيديو {index}</b>\n📊 الجودة المكتشفة: <code>{quality}p</code>\n\n📹 أرسل الفيديو التالي أو استخدم <code>/finish</code> لإكمال التحميل.",
  },

  admin_movie_complete: {
    fa: "<b>✅ فیلم با موفقیت آپ لود شد!</b>\n\n🎬 <code>{title}</code>\n🎞️ حداکثر کیفیت: <code>{quality}p</code>\n📊 ویدیوها: <code>{count}</code>\n\n🔗 لینک عمیق: <code>{deepLink}</code>",
    en: "<b>✅ Movie uploaded successfully!</b>\n\n🎬 <code>{title}</code>\n🎞️ Max Quality: <code>{quality}p</code>\n📊 Videos: <code>{count}</code>\n\n🔗 Deep Link: <code>{deepLink}</code>",
    ar: "<b>✅ تم تحميل الفيلم بنجاح!</b>\n\n🎬 <code>{title}</code>\n🎞️ الحد الأقصى للجودة: <code>{quality}p</code>\n📊 مقاطع الفيديو: <code>{count}</code>\n\n🔗 الرابط العميق: <code>{deepLink}</code>",
  },

  admin_not_in_upload: {
    fa: "❌ شما در حال آپ لود فیلم نیستید. برای شروع از /newmovie استفاده کنید.",
    en: "❌ You are not in the process of uploading a movie. Use /newmovie to start.",
    ar: "❌ أنت لا تقوم بعملية تحميل فيلم. استخدم /newmovie للبدء.",
  },

  admin_incomplete_draft: {
    fa: "❌ پیش‌نویس ناقص است. لطفاً عنوان، بنر، و حداقل یک ویدیو ارائه دهید.",
    en: "❌ Draft is incomplete. Please provide title, banner, and at least one video.",
    ar: "❌ المسودة غير مكتملة. يرجى تقديم العنوان والشعار وفيديو واحد على الأقل.",
  },

  admin_upload_failed: {
    fa: "❌ فیلم ذخیره نشد. لطفاً دوباره تلاش کنید. خطا: {error}",
    en: "❌ Failed to save movie. Please try again. Error: {error}",
    ar: "❌ فشل في حفظ الفيلم. يرجى المحاولة مرة أخرى. خطأ: {error}",
  },

  admin_start_failed: {
    fa: "❌ آپ لود فیلم شروع نشد. لطفاً دوباره تلاش کنید.",
    en: "❌ Failed to start movie upload. Please try again.",
    ar: "❌ فشل في بدء تحميل الفيلم. يرجى المحاولة مرة أخرى.",
  },

  admin_video_failed: {
    fa: "❌ ویدیو ذخیره نشد. لطفاً دوباره تلاش کنید.",
    en: "❌ Failed to save video. Please try again.",
    ar: "❌ فشل في حفظ الفيديو. يرجى المحاولة مرة أخرى.",
  },

  admin_photo_invalid: {
    fa: "❌ عکس یافت نشد. لطفاً عکس معتبری ارسال کنید.",
    en: "❌ No photo found. Please send a valid image.",
    ar: "❌ لم يتم العثور على صورة. يرجى إرسال صورة صحيحة.",
  },

  admin_invalid_video: {
    fa: "❌ فایل ویدیویی معتبری یافت نشد. لطفاً دوباره تلاش کنید.",
    en: "❌ Invalid video file. Please try again.",
    ar: "❌ ملف فيديو غير صحيح. يرجى المحاولة مرة أخرى.",
  },

  // User Workflow - Messages
  user_welcome: {
    fa: "<b>🎬 خوش‌آمد به ربات آپ لودکننده فیلم!</b>\n\nاین ربات به مدیران اجازه می‌دهد فیلم‌ها و سریال‌ها را برای دانلود آپ لود کنند.\n\n🎥 <b>برای مدیران:</b>\n• برای آپ لود فیلم جدید از /newmovie استفاده کنید\n• از جادوگر برای افزودن عنوان، بنر و ویدیوها پیروی کنید\n\n📥 <b>برای کاربران:</b>\n• لینک‌ها را برای دانلود فیلم دریافت کنید\n• کیفیت ترجیحی خود را انتخاب کنید\n\n❓ نیاز به کمک؟ از مدیر ربات تماس بگیرید.",
    en: "<b>🎬 Welcome to Movie Uploader Bot!</b>\n\nThis bot allows admins to upload movies and series for download.\n\n🎥 <b>For Admins:</b>\n• Use /newmovie to upload a new movie\n• Follow the wizard to add title, banner, and videos\n\n📥 <b>For Users:</b>\n• Receive links to download movies\n• Choose your preferred quality\n\n❓ Need help? Contact the bot administrator.",
    ar: "<b>🎬 مرحباً بك في تطبيق رفع الأفلام!</b>\n\nيسمح هذا التطبيق للمسؤولين برفع الأفلام والمسلسلات للتنزيل.\n\n🎥 <b>للمسؤولين:</b>\n• استخدم /newmovie لرفع فيلم جديد\n• اتبع المعالج لإضافة العنوان والشعار ومقاطع الفيديو\n\n📥 <b>للمستخدمين:</b>\n• تلقي روابط لتنزيل الأفلام\n• اختر جودتك المفضلة\n\n❓ هل تحتاج إلى مساعدة؟ تواصل مع مسؤول التطبيق.",
  },

  user_movie_not_found: {
    fa: "❌ فیلم یافت نشد. ممکن است حذف شده باشد.",
    en: "❌ Movie not found. It may have been deleted.",
    ar: "❌ لم يتم العثور على الفيلم. قد يكون قد تم حذفه.",
  },

  user_invalid_link: {
    fa: "❌ لینک فیلم معتبر نیست. لطفاً دوباره تلاش کنید.",
    en: "❌ Invalid movie link. Please try again.",
    ar: "❌ لينك الفيلم غير صحيح. يرجى المحاولة مرة أخرى.",
  },

  user_no_videos: {
    fa: "❌ فایل ویدیویی برای این فیلم در دسترس نیست.",
    en: "❌ No video files available for this movie.",
    ar: "❌ لا توجد ملفات فيديو متاحة لهذا الفيلم.",
  },

  user_quality_not_found: {
    fa: "❌ ویدیوی با کیفیت {quality}p یافت نشد.",
    en: "❌ Video with {quality}p quality not found.",
    ar: "❌ لم يتم العثور على فيديو بجودة {quality}p.",
  },

  user_quality_available: {
    fa: "<b>{title}</b>\n\n📊 <b>کیفیت موجود:</b>\n{qualities}\n\n👇 <i>برای دانلود کیفیت را انتخاب کنید:</i>",
    en: "<b>{title}</b>\n\n📊 <b>Available Quality:</b>\n{qualities}\n\n👇 <i>Select quality to download:</i>",
    ar: "<b>{title}</b>\n\n📊 <b>الجودة المتاحة:</b>\n{qualities}\n\n👇 <i>اختر الجودة للتنزيل:</i>",
  },

  user_sending_video: {
    fa: "📥 جاری ارسال ویدیو...",
    en: "📥 Sending video...",
    ar: "📥 جاري إرسال الفيديو...",
  },

  user_send_failed: {
    fa: "❌ ویدیو ارسال نشد. لطفاً دوباره تلاش کنید.",
    en: "❌ Failed to send video. Please try again.",
    ar: "❌ فشل في إرسال الفيديو. يرجى المحاولة مرة أخرى.",
  },

  user_video_caption: {
    fa: "<b>{title}</b>\n\n📊 کیفیت: {quality}\n\n✨ از تماشای فیلم خود لذت ببرید!",
    en: "<b>{title}</b>\n\n📊 Quality: {quality}\n\n✨ Enjoy watching your movie!",
    ar: "<b>{title}</b>\n\n📊 الجودة: {quality}\n\n✨ استمتع بمشاهدة فيلمك!",
  },

  // Quality Buttons
  quality_button: {
    fa: "📥 کیفیت {quality}p",
    en: "📥 Quality {quality}p",
    ar: "📥 جودة {quality}p",
  },

  quality_label_1080: {
    fa: "1080p HD",
    en: "1080p HD",
    ar: "1080p HD",
  },

  banner_quality_header: {
    fa: "کیفیت موجود:",
    en: "Available Qualities:",
    ar: "الجودة المتاحة:",
  },

  banner_download_prompt: {
    fa: "برای دانلود دکمه را کلیک کنید",
    en: "Click the button below to download",
    ar: "انقر على الزر لتنزيل",
  },

  quality_label_720: {
    fa: "720p HD",
    en: "720p HD",
    ar: "720p HD",
  },

  quality_label_480: {
    fa: "480p SD",
    en: "480p SD",
    ar: "480p SD",
  },

  // Error Messages
  error_unauthorized: {
    fa: "❌ شما مجاز به استفاده از این دستور نیستید.",
    en: "❌ You are not authorized to use this command.",
    ar: "❌ أنت غير مصرح باستخدام هذا الأمر.",
  },

  error_unknown_command: {
    fa: "<b>دستور نامشخص:</b> <code>{command}</code>\n\n📋 دستورات موجود:\n• /newmovie - آپ لود فیلم جدید\n• /finish - اتمام آپ لود فیلم",
    en: "<b>Unknown command:</b> <code>{command}</code>\n\n📋 Available commands:\n• /newmovie - Upload a new movie\n• /finish - Complete movie upload",
    ar: "<b>أمر غير معروف:</b> <code>{command}</code>\n\n📋 الأوامر المتاحة:\n• /newmovie - رفع فيلم جديد\n• /finish - إكمال تحميل الفيلم",
  },

  // Language selection buttons
  lang_persian: {
    fa: "🇮🇷 فارسی",
    en: "🇮🇷 Persian",
    ar: "🇮🇷 فارسي",
  },

  lang_english: {
    fa: "🇬🇧 انگلیسی",
    en: "🇬🇧 English",
    ar: "🇬🇧 الإنجليزية",
  },

  lang_arabic: {
    fa: "🇦🇪 عربی",
    en: "🇦🇪 Arabic",
    ar: "🇦🇪 العربية",
  },

  lang_selected: {
    fa: "✅ زبان فارسی انتخاب شد.",
    en: "✅ English language selected.",
    ar: "✅ تم اختيار اللغة العربية.",
  },

  // Admin Panel Messages
  admin_panel_menu: {
    fa: "<b>🎛️ پنل مدیریت</b>\n\nدستورات موجود:\n• 📝 ویرایش قالب پست\n• ⚙️ تنظیمات\n• 📋 پست‌های منتظر تایید",
    en: "<b>🎛️ Admin Panel</b>\n\nAvailable commands:\n• 📝 Edit Post Template\n• ⚙️ Settings\n• 📋 Pending Posts",
    ar: "<b>🎛️ لوحة التحكم</b>\n\nالأوامر المتاحة:\n• 📝 تحرير قالب البريد\n• ⚙️ الإعدادات\n• 📋 الرسائل المعلقة",
  },

  admin_template_editor: {
    fa: "<b>📝 محرر قالب پست</b>\n\nمتغیرهای قابل استفاده:\n• {title} - عنوان فیلم\n• {max_quality} - حداکثر کیفیت\n• {qualities_list} - لیست کیفیت‌های موجود\n\nدستورات:\n• مشاهده فعلی - نمایش قالب فعلی\n• بازنشانی - بازگشت به قالب پیش‌فرض\n• سفارشی - ایجاد قالب جدید",
    en: "<b>📝 Template Editor</b>\n\nAvailable variables:\n• {title} - Movie title\n• {max_quality} - Maximum quality\n• {qualities_list} - List of available qualities\n\nCommands:\n• View Current - Display current template\n• Reset to Default - Restore default template\n• Custom Template - Create new template",
    ar: "<b>📝 محرر القالب</b>\n\nالمتغيرات المتاحة:\n• {title} - عنوان الفيلم\n• {max_quality} - الحد الأقصى للجودة\n• {qualities_list} - قائمة الجودات المتاحة\n\nالأوامر:\n• عرض الحالي - عرض القالب الحالي\n• إعادة تعيين - استعادة القالب الافتراضي\n• قالب مخصص - إنشاء قالب جديد",
  },

  admin_settings_menu: {
    fa: "<b>⚙️ تنظیمات مدیر</b>\n\nتنظیمات موجود:\n• 🌐 زبان دکمه‌های کانال (فارسی، انگلیسی، عربی)\n\nتنظیمات بیشتر به زودی...",
    en: "<b>⚙️ Admin Settings</b>\n\nAvailable Settings:\n• 🌐 Channel Button Language (Persian, English, Arabic)\n\nMore settings coming soon...",
    ar: "<b>⚙️ إعدادات المسؤول</b>\n\nالإعدادات المتاحة:\n• 🌐 لغة زر القناة (فارسي وإنجليزي وعربي)\n\nإعدادات أخرى قريباً...",
  },

  admin_post_approval: {
    fa: "<b>✋ تایید پست</b>\n\nپست شما منتظر تایید است.\n\nعنوان: {title}\nکیفیت: {quality}\n\nاگر رضایت دارید، دکمه تایید را فشار دهید.",
    en: "<b>✋ Post Approval</b>\n\nYour post is waiting for approval.\n\nTitle: {title}\nQuality: {quality}\n\nIf satisfied, click the approval button.",
    ar: "<b>✋ الموافقة على البريد</b>\n\nرسالتك في انتظار الموافقة.\n\nالعنوان: {title}\nالجودة: {quality}\n\nإذا كنت راضياً، انقر على زر الموافقة.",
  },

  admin_post_published: {
    fa: "✅ پست با موفقیت منتشر شد!",
    en: "✅ Post published successfully!",
    ar: "✅ تم نشر البريد بنجاح!",
  },

  admin_post_rejected: {
    fa: "❌ پست رد شد.",
    en: "❌ Post rejected.",
    ar: "❌ تم رفض البريد.",
  },

  admin_db_channel_error: {
    fa: "❌ خطا در ذخیره‌سازی در کانال پایگاه‌داده. لطفاً دوباره تلاش کنید.",
    en: "❌ Error storing in database channel. Please try again.",
    ar: "❌ خطأ في التخزين في قناة قاعدة البيانات. يرجى المحاولة مرة أخرى.",
  },

  admin_secure_delivery: {
    fa: "✅ ویدیو با ایمنی از کانال پایگاه‌داده ارسال شد.",
    en: "✅ Video securely delivered from database channel.",
    ar: "✅ تم تسليم الفيديو بأمان من قناة قاعدة البيانات.",
  },
};

/**
 * Get translation string for a given key and language
 */
export function t(key, lang = "en", replacements = {}) {
  if (!translations[key]) {
    console.warn(`[i18n] Missing translation key: ${key}`);
    return key;
  }

  if (!translations[key][lang]) {
    console.warn(
      `[i18n] Missing translation for key: ${key}, language: ${lang}`,
    );
    lang = "en"; // Fallback to English
  }

  let text = translations[key][lang];

  // Replace placeholders like {title}, {quality}, {count}, etc.
  Object.entries(replacements).forEach(([placeholder, value]) => {
    text = text.replace(`{${placeholder}}`, value);
  });

  return text;
}

/**
 * Create language selection keyboard
 */
export function getLanguageKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🇮🇷 فارسی",
          callback_data: "lang_fa",
        },
      ],
      [
        {
          text: "🇬🇧 English",
          callback_data: "lang_en",
        },
      ],
      [
        {
          text: "🇦🇪 العربية",
          callback_data: "lang_ar",
        },
      ],
    ],
  };
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages() {
  return Object.keys(LANGUAGES);
}

/**
 * Get language name
 */
export function getLanguageName(lang) {
  return LANGUAGES[lang] || LANGUAGES.en;
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(lang) {
  return Object.keys(LANGUAGES).includes(lang);
}
