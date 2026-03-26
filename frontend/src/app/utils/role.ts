export function formatRole (role?: string) { 
    switch (role) {
        case "STUDENT":
            return "ผู้เรียน";
        case "TEACHER":
            return "อาจารย์";
        default:
            return "ไม่ระบุ";
    }
}