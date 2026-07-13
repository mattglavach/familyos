import {MAX_ATTACHMENT_BYTES,safeStorageName,validateAttachment} from "./attachments";
test("validates attachment mime and size",()=>{expect(validateAttachment({type:"image/png",size:100})).toBe("");expect(validateAttachment({type:"text/plain",size:100})).toMatch(/JPEG/);expect(validateAttachment({type:"application/pdf",size:MAX_ATTACHMENT_BYTES+1})).toMatch(/10 MB/);});
test("creates opaque safe storage names",()=>{const name=safeStorageName("../../Family File.PDF");expect(name).toMatch(/^[a-f0-9-]+\.pdf$/);expect(name).not.toContain("Family");});
