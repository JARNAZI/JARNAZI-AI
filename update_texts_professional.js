const fs = require('fs');

const envStr = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
for (const line of envStr.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
}

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || envVars.SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

const privacyHtml = `
<div dir="rtl" style="text-align: right; font-family: sans-serif; line-height: 1.8;">
    <h2 style="color: #6366f1; margin-bottom: 20px;">سياسة الخصوصية (Privacy Policy)</h2>
    
    <p>نحن في <strong>Jarnazi AI Consensus</strong> نولي اهتماماً كبيراً لخصوصية مستخدمينا وحماية بياناتهم الشخصية. توضح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لبياناتك عند استخدام منصتنا.</p>
    
    <h3 style="color: #818cf8; margin-top: 30px;">1. البيانات التي نقوم بجمعها</h3>
    <ul style="list-style-type: disc; margin-right: 20px; margin-bottom: 20px;">
        <li><strong>المعلومات الشخصية:</strong> مثل الاسم وعنوان البريد الإلكتروني الذي تقدمه عند التسجيل.</li>
        <li><strong>بيانات الاستخدام:</strong> مدخلاتك، الأسئلة، والملفات المرفقة (النصوص، الصور، الصوت، الفيديو) التي تشاركها مع مجلس الذكاء الاصطناعي.</li>
        <li><strong>البيانات التقنية:</strong> عنوان IP، نوع المتصفح، ومعلومات الجهاز لأغراض الأمان وتحسين الأداء.</li>
    </ul>

    <h3 style="color: #818cf8; margin-top: 30px;">2. كيف نستخدم بياناتك؟</h3>
    <ul style="list-style-type: disc; margin-right: 20px; margin-bottom: 20px;">
        <li>لتقديم خدمات المنصة لك وتسيير جلسات النقاش بدقة بين نماذج الذكاء الاصطناعي.</li>
        <li>لمنع الاحتيال، حماية الأنظمة من الهجمات، وكشف حركات الدخول غير المصرح بها.</li>
        <li>للتواصل معك للرد على استفساراتك وتقديم الدعم الفني اللازم.</li>
        <li>لتحسين دقة النماذج وتخصيص تجربة الاستخدام بشكل يخدم أهداف البحث والمعرفة.</li>
    </ul>

    <h3 style="color: #818cf8; margin-top: 30px;">3. حماية البيانات والتشفير</h3>
    <p>نلتزم باستخدام أحدث معايير التشفير والأمان لحماية بياناتك من الوصول غير المصرح به أو التعديل أو التدمير. يتم تأمين جميع المراسلات والنقاشات داخل الشبكة.</p>

    <h3 style="color: #818cf8; margin-top: 30px;">4. حقوقك كمسخدم</h3>
    <ul style="list-style-type: disc; margin-right: 20px; margin-bottom: 20px;">
        <li><strong>الوصول والحذف:</strong> يحق لك في أي وقت الدخول إلى حسابك، تعديل بياناتك، أو طلب حذف حسابك نهائياً من أنظمتنا والذي سيؤدي إلى مسح معلوماتك.</li>
        <li><strong>إلغاء الاشتراك:</strong> يمكنك إلغاء الاشتراك في التنبيهات ورسائل البريد الإلكتروني التسويقية في أي وقت.</li>
    </ul>

    <h3 style="color: #818cf8; margin-top: 30px;">5. تغييرات سياسة الخصوصية</h3>
    <p>نحتفظ بالحق في تحديث هذه السياسة من حين لآخر. يُرجى مراجعة هذه الصفحة بانتظام للتعرف على أي تغييرات.</p>

    <div style="margin-top: 40px; padding: 20px; background: rgba(99, 102, 241, 0.1); border-radius: 10px; border: 1px solid rgba(99, 102, 241, 0.2);">
        <strong>هل لديك أسئلة؟</strong> تواصل معنا عبر صفحة الاتصال في أي وقت.
    </div>
</div>
`;

const termsHtml = `
<div dir="rtl" style="text-align: right; font-family: sans-serif; line-height: 1.8;">
    <h2 style="color: #6366f1; margin-bottom: 20px;">شروط الاستخدام (Terms of Use)</h2>
    
    <p>مرحباً بك في منصة <strong>Jarnazi AI Consensus</strong>. باستخدامك لهذه المنصة، فإنك توافق بشكل كامل على الشروط والأحكام التالية الموضحة أدناه. يُرجى قراءتها بعناية.</p>

    <h3 style="color: #818cf8; margin-top: 30px;">1. قبول الشروط وتطبيقها</h3>
    <p>بمجرد تسجيلك واستخدامك لخدمات المنصة، يُعد ذلك موافقة صريحة وملزمة قانونياً على الالتزام بهذه الشروط وبسياسة الخصوصية الخاصة بنا.</p>

    <h3 style="color: #818cf8; margin-top: 30px;">2. الاستخدام المسموح به</h3>
    <p>يُسمح باستخدام هذه المنصة لأغراض البحث، التعلم، واستخلاص المعرفة. ومع ذلك، <strong>يُمنع منعاً باتاً</strong> القيام بما يلي:</p>
    <ul style="list-style-type: disc; margin-right: 20px; margin-bottom: 20px;">
        <li>استخدام المنصة لتوليد محتوى غير قانوني، مسيء، مضلل، أو ينتهك حقوق الآخرين.</li>
        <li>محاولة اختراق النظام، إرسال برمجيات خبيثة، أو التلاعب بالتوكنات والمدفوعات.</li>
        <li>إدخال استعلامات ضخمة مستمرة باستخدام برمجيات روبوتية (Bots) بغرض تعطيل الخدمة أو استنزاف الموارد.</li>
    </ul>

    <h3 style="color: #818cf8; margin-top: 30px;">3. نظام التوكنات والاستخدام</h3>
    <ul style="list-style-type: disc; margin-right: 20px; margin-bottom: 20px;">
        <li>تعتمد خدمات المنصة على نظام <strong>التوكنات</strong>. يتم استهلاك التوكنات بناءً على حجم النصوص والوسائط في المدخلات والمخرجات.</li>
        <li>الحصة المجانية مقدمة للاستخدام لمرة واحدة كتجربة مبدئية حصرية للنصوص ولا تشمل الوسائط مثل الصور، الصوت أو الفيديو.</li>
        <li>يعتبر رصيد التوكنات قيمة رقمية لاستخدام المنصة ويُعد غير قابل للاسترداد بعد الدفع بنجاح.</li>
    </ul>

    <h3 style="color: #818cf8; margin-top: 30px;">4. إخلاء المسؤولية المخرجات الذكاء الاصطناعي</h3>
    <p>تقدم المنصة الإجابات عبر نماذج ذكاء اصطناعي متعددة تصل إلى توافق أو إجماع (Consensus). يرجى ملاحظة أن هذه المخرجات يتم توفيرها بناءً على احتمالات برمجية، وبالتالي:</p>
    <ul style="list-style-type: disc; margin-right: 20px; margin-bottom: 20px;">
        <li>لا نضمن الدقة المطلقة والمثالية للمعلومات الناتجة.</li>
        <li>تقع مسؤولية التحقق الكامل من النتائج والمخرجات على عاتق المستخدم، ولا نتحمل أي مسؤولية عن القرارات المتخذة بناءً عليها.</li>
    </ul>

    <h3 style="color: #818cf8; margin-top: 30px;">5. تعليق أو إنهاء الحساب</h3>
    <p>نحتفظ بكامل الحق في تعليق أو إغلاق حسابك دون إشعار مسبق في حال انتهاك هذه الشروط، أو رصد أي نشاط مشبوه، أو محاولة استغلال ثغرات النظام.</p>

    <h3 style="color: #818cf8; margin-top: 30px;">6. التعديل على شروط الاستخدام</h3>
    <p>يجوز لنا تحديث صفحة الشروط والأحكام لتواكب تغييرات وتطورات المنصة. ويكون الاستخدام المستمر للخدمة بعد هذا التحديث بمثابة قبول صريح بتلك التعديلات.</p>
</div>
`;

async function main() {
    try {
        console.log("Updating DB...");

        // 1. Delete ALL keys that might be duplicates
        await supabase.from('site_settings').delete().in('key', ['privacy_text', 'terms_text']);

        // 2. Insert the fresh correctly formatted HTML ones
        const { error } = await supabase.from('site_settings').insert([
            { key: 'privacy_text', value: privacyHtml, type: 'text' },
            { key: 'terms_text', value: termsHtml, type: 'text' }
        ]);

        if (error) {
            console.error("Failed to insert:", error.message);
            process.exit(1);
        }
        console.log("SUCCESS! Created professional HTML Privacy and Terms");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
