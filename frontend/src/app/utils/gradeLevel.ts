export function gradeLevel(level?: string) {
    switch (level) {
        case "VOC_1":
            return "ปวช.1";
        case "VOC_2":
            return "ปวช.2";
        case "VOC_3":
            return "ปวช.3";
        case "VHC_1":
            return "ปวส.1";
        case "VHC_2":
            return "ปวส.2";
        default:
            return "ไม่ระบุ";
    }
}