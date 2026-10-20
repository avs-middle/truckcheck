/**
 * TruckCheck sender — วางสคริปต์นี้ใน Google Apps Script ของบัญชี avs.middle@gmail.com
 * แอปบนมือถือส่งรายงาน + รูปมาที่นี่ แล้วสคริปต์ส่งอีเมลเข้า Gmail กลางและติดป้าย TruckCheck ให้
 * ผู้รับกำหนดไว้ตรงนี้ที่เดียว ผู้ตรวจไม่เห็นและแก้ไม่ได้
 */
const TO = 'avs.middle@gmail.com';
const TOKEN = 'tc-avs-7Qm2xK9pV4';      // ต้องตรงกับ SEND_TOKEN ในแอป
const LABEL = 'TruckCheck';
const MAX_FILES = 20;

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    if (p.token !== TOKEN) return out_({ ok: false, error: 'bad token' });
    if (!p.subject || !p.text || p.text.indexOf('===TRUCKCHECK-DATA===') < 0) return out_({ ok: false, error: 'bad payload' });

    const files = (p.files || []).slice(0, MAX_FILES).map(f =>
      Utilities.newBlob(Utilities.base64Decode(f.data), f.type || 'image/jpeg', String(f.name || 'photo.jpg').slice(0, 80)));

    // ส่งผ่าน draft เพื่อได้ตัวอีเมลกลับมา แล้วติดป้ายกำกับให้ทันที (ไม่ต้องพึ่ง Gmail filter)
    const msg = GmailApp.createDraft(TO, String(p.subject).slice(0, 250), p.text, { attachments: files, name: 'TruckCheck' }).send();
    const label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
    msg.getThread().addLabel(label);

    return out_({ ok: true, id: p.id || null });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}

// เปิดลิงก์ web app ในเบราว์เซอร์เพื่อตรวจว่าทำงาน: ต้องเห็น {"ok":true,"service":"truckcheck"}
function doGet() {
  return out_({ ok: true, service: 'truckcheck' });
}

// กด Run ฟังก์ชันนี้ 1 ครั้งในหน้า Apps Script เพื่ออนุญาตสิทธิ์ Gmail และทดลองส่ง
function testSend() {
  const msg = GmailApp.createDraft(TO, '[TruckCheck] ทดสอบระบบ', 'ทดสอบจาก Apps Script\n===TRUCKCHECK-DATA===\n{"v":1,"test":true}\n===END===').send();
  msg.getThread().addLabel(GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL));
  Logger.log('ส่งแล้ว: ' + msg.getSubject());
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
