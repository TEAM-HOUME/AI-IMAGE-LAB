import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';

const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflict

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// Multer 설정 (인페인팅용 파일 업로드)
const upload = multer({ storage: multer.memoryStorage() });

// 이미지 생성 프록시
app.post('/api/images/generations', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const apiKey = authorization?.replace('Bearer ', '');

        if (!apiKey) {
            return res.status(401).json({ error: 'API 키가 필요합니다.' });
        }

        console.log('이미지 생성 요청:', {
            model: req.body.model,
            prompt: req.body.prompt?.substring(0, 100) + '...',
            size: req.body.size,
            quality: req.body.quality,
            n: req.body.n,
            response_format: req.body.response_format || 'default'
        });

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenAI API 오류:', {
                status: response.status,
                statusText: response.statusText,
                error: data
            });
            return res.status(response.status).json(data);
        }

        console.log('이미지 생성 성공:', data.data?.length, '개 이미지');
        res.json(data);

    } catch (error) {
        console.error('프록시 서버 오류:', error);
        res.status(500).json({ 
            error: { 
                message: `서버 내부 오류: ${error.message}` 
            } 
        });
    }
});

// 인페인팅 프록시
app.post('/api/images/edits', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mask', maxCount: 1 }
]), async (req, res) => {
    try {
        const { authorization } = req.headers;
        const apiKey = authorization?.replace('Bearer ', '');

        if (!apiKey) {
            return res.status(401).json({ error: 'API 키가 필요합니다.' });
        }

        if (!req.files.image || !req.files.mask) {
            return res.status(400).json({ 
                error: { 
                    message: '이미지와 마스크 파일이 모두 필요합니다.' 
                } 
            });
        }

        console.log('인페인팅 요청:', {
            prompt: req.body.prompt,
            model: req.body.model,
            size: req.body.size,
            imageSize: req.files.image[0].size,
            maskSize: req.files.mask[0].size
        });

        // FormData 생성
        const formData = new FormData();
        formData.append('prompt', req.body.prompt);
        formData.append('model', req.body.model || 'gpt-image-1');
        formData.append('n', req.body.n || '1');
        formData.append('size', req.body.size || '1024x1024');
        
        // 이미지 파일들 추가
        formData.append('image', req.files.image[0].buffer, {
            filename: 'image.png',
            contentType: 'image/png'
        });
        formData.append('mask', req.files.mask[0].buffer, {
            filename: 'mask.png',
            contentType: 'image/png'
        });

        const response = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenAI 인페인팅 API 오류:', data);
            return res.status(response.status).json(data);
        }

        console.log('인페인팅 성공:', data.data?.length, '개 이미지');
        res.json(data);

    } catch (error) {
        console.error('인페인팅 프록시 서버 오류:', error);
        res.status(500).json({ 
            error: { 
                message: `인페인팅 서버 내부 오류: ${error.message}` 
            } 
        });
    }
});

// 이미지 다운로드 프록시 (CORS 해결)
app.get('/api/download-image', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL 파라미터가 필요합니다.' });
        }

        console.log('이미지 다운로드 요청:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
            return res.status(response.status).json({ error: '이미지를 다운로드할 수 없습니다.' });
        }

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        response.body.pipe(res);

    } catch (error) {
        console.error('이미지 다운로드 오류:', error);
        res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
});

// 건강 체크 엔드포인트
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 에러 핸들러
app.use((error, req, res, next) => {
    console.error('서버 에러:', error);
    res.status(500).json({ 
        error: { 
            message: '서버 내부 오류가 발생했습니다.' 
        } 
    });
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ 
        error: { 
            message: '요청한 리소스를 찾을 수 없습니다.' 
        } 
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 OpenAI 이미지 생성 프록시 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`📊 건강 체크: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('서버를 종료합니다...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('서버를 종료합니다...');
    process.exit(0);
}); 