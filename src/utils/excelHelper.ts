import * as XLSX from 'xlsx';
import { Question, GameSession } from '../types';

export function exportQuestionsToExcel(questions: Question[], filename = 'Ngan_hang_cau_hoi_quan_ly.xlsx') {
  const rows = questions.map((q, idx) => ({
    'STT': idx + 1,
    'Mã ID': q.id,
    'Loại câu hỏi': q.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Trả lời ngắn',
    'Chủ đề / Kỹ năng': q.category,
    'Nội dung câu hỏi': q.question,
    'Đáp án A': q.options?.A || '',
    'Đáp án B': q.options?.B || '',
    'Đáp án C': q.options?.C || '',
    'Đáp án D': q.options?.D || '',
    'Đáp án đúng (A/B/C/D)': q.correctAnswer || '',
    'Giải thích / Tiêu chí chấm': q.explanation || '',
    'Thời gian (giây)': q.timeLimitSeconds || 30,
    'Điểm số': q.points || 10,
    'Link ảnh minh họa': q.imageUrl || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CauHoi');

  // Auto column widths
  const colWidths = [
    { wch: 6 },  // STT
    { wch: 10 }, // ID
    { wch: 16 }, // Loại
    { wch: 25 }, // Chủ đề
    { wch: 45 }, // Câu hỏi
    { wch: 30 }, // A
    { wch: 30 }, // B
    { wch: 30 }, // C
    { wch: 30 }, // D
    { wch: 12 }, // Đáp án đúng
    { wch: 40 }, // Giải thích
    { wch: 15 }, // Thời gian
    { wch: 10 }, // Điểm
    { wch: 25 }, // Ảnh
  ];
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename);
}

export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'STT': 1,
      'Mã ID': 'q_demo_1',
      'Loại câu hỏi': 'Trắc nghiệm',
      'Chủ đề / Kỹ năng': 'Ủy quyền',
      'Nội dung câu hỏi': 'Nguyên tắc quan trọng nhất khi ủy quyền công việc cho cấp dưới là gì?',
      'Đáp án A': 'Chỉ giao việc đơn giản, giữ việc quan trọng cho bản thân',
      'Đáp án B': 'Giao mục tiêu, trao quyền hạn tương ứng và thiết lập mốc kiểm tra định kỳ',
      'Đáp án C': 'Giao toàn bộ và không kiểm tra lại',
      'Đáp án D': 'Làm cùng từng bước để đảm bảo không có lỗi',
      'Đáp án đúng (A/B/C/D)': 'B',
      'Giải thích / Tiêu chí chấm': 'Ủy quyền hiệu quả cần gắn liền mục tiêu, quyền hạn và cơ chế kiểm soát.',
      'Thời gian (giây)': 30,
      'Điểm số': 10,
      'Link ảnh minh họa': '',
    },
    {
      'STT': 2,
      'Mã ID': 'q_demo_2',
      'Loại câu hỏi': 'Trả lời ngắn',
      'Chủ đề / Kỹ năng': 'Giải quyết mâu thuẫn',
      'Nội dung câu hỏi': 'Nêu 3 nguyên tắc bạn áp dụng khi hòa giải xung đột giữa 2 nhân sự chủ chốt.',
      'Đáp án A': '',
      'Đáp án B': '',
      'Đáp án C': '',
      'Đáp án D': '',
      'Đáp án đúng (A/B/C/D)': '',
      'Giải thích / Tiêu chí chấm': 'Lắng nghe trung lập, tập trung vào vấn đề chứ không công kích con người, hướng về mục tiêu chung.',
      'Thời gian (giây)': 90,
      'Điểm số': 20,
      'Link ảnh minh họa': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Cau_Hoi');
  XLSX.writeFile(workbook, 'Mau_nhap_cau_hoi_quan_ly.xlsx');
}

export async function parseQuestionsFromExcel(file: File): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (!jsonData || jsonData.length === 0) {
          throw new Error('File Excel không có dữ liệu!');
        }

        const parsed: Question[] = jsonData.map((row, index) => {
          // Flexible key lookup to support both Vietnamese and English headers
          const typeRaw = String(row['Loại câu hỏi'] || row['Type'] || row['Loai'] || '').toLowerCase();
          const isShort = typeRaw.includes('ngắn') || typeRaw.includes('short') || typeRaw.includes('tự luận') || typeRaw.includes('essay');

          const optA = String(row['Đáp án A'] || row['Option A'] || row['A'] || '').trim();
          const optB = String(row['Đáp án B'] || row['Option B'] || row['B'] || '').trim();
          const optC = String(row['Đáp án C'] || row['Option C'] || row['C'] || '').trim();
          const optD = String(row['Đáp án D'] || row['Option D'] || row['D'] || '').trim();

          const correctRaw = String(row['Đáp án đúng (A/B/C/D)'] || row['Đáp án đúng'] || row['Correct'] || row['Dap an'] || '')
            .trim()
            .toUpperCase();
          const validAnswer = ['A', 'B', 'C', 'D'].includes(correctRaw) ? (correctRaw as 'A' | 'B' | 'C' | 'D') : undefined;

          const questionText = String(row['Nội dung câu hỏi'] || row['Câu hỏi'] || row['Question'] || '').trim();
          if (!questionText) {
            throw new Error(`Dòng thứ ${index + 2} bị thiếu nội dung câu hỏi!`);
          }

          const q: Question = {
            id: String(row['Mã ID'] || row['ID'] || `q_imported_${Date.now()}_${index}`),
            type: isShort ? 'short_answer' : 'multiple_choice',
            category: String(row['Chủ đề / Kỹ năng'] || row['Chủ đề'] || row['Category'] || 'Kỹ năng quản lý').trim(),
            question: questionText,
            explanation: String(row['Giải thích / Tiêu chí chấm'] || row['Giải thích'] || row['Explanation'] || '').trim(),
            timeLimitSeconds: Number(row['Thời gian (giây)'] || row['Thời gian'] || row['Time']) || (isShort ? 90 : 30),
            points: Number(row['Điểm số'] || row['Điểm'] || row['Points']) || (isShort ? 20 : 10),
            imageUrl: String(row['Link ảnh minh họa'] || row['Image'] || '').trim() || undefined,
          };

          if (!isShort) {
            q.options = {
              A: optA || 'Đáp án A',
              B: optB || 'Đáp án B',
              C: optC || 'Đáp án C',
              D: optD || 'Đáp án D',
            };
            q.correctAnswer = validAnswer || 'A';
          }

          return q;
        });

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function exportStudentSubmissionsToExcel(sessions: GameSession[], filename = 'Ket_qua_hoc_vien_quan_ly.xlsx') {
  const rows: Record<string, unknown>[] = [];

  sessions.forEach((session, sessionIdx) => {
    session.answers.forEach((ans, ansIdx) => {
      const q = session.questionsSnapshot.find((item) => item.id === ans.questionId);
      rows.push({
        'Phiên thi': sessionIdx + 1,
        'Họ và tên': session.playerName,
        'Phòng ban': session.department || 'Chưa ghi',
        'Thời gian hoàn thành': session.completedAt,
        'Tổng điểm': session.totalScore,
        'Điểm tối đa': session.maxScore,
        'Câu số': ansIdx + 1,
        'Chủ đề': q?.category || '',
        'Loại câu hỏi': q?.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Trả lời ngắn',
        'Nội dung câu hỏi': q?.question || '',
        'Học viên chọn / Trả lời': q?.type === 'multiple_choice' ? ans.selectedOption : ans.shortAnswerText,
        'Đáp án chuẩn': q?.correctAnswer || '(Giảng viên chấm)',
        'Kết quả trắc nghiệm': q?.type === 'multiple_choice' ? (ans.isCorrect ? 'ĐÚNG' : 'SAI') : 'Cần chấm thủ công',
        'Điểm Giảng viên chấm': ans.instructorScore ?? '',
        'Nhận xét của Giảng viên': ans.instructorFeedback ?? '',
        'Thời gian làm (giây)': ans.timeSpentSeconds,
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BaiLamHocVien');
  XLSX.writeFile(workbook, filename);
}
