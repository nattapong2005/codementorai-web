export function formatFeedback (feedback?: string) { 
    switch (feedback) {
        case "HINT":
            return "คําใบ้";
        case "CONCEPT":
            return "อธิบายแนวคิด";
        case "ANSWER":
            return "เฉลยละเอียด";
        case "NONE":
            return "ไม่แสดง";
        default:
            return "ไม่ระบุ";
    }
}