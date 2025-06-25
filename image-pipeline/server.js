import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflict

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// Multer 설정 (인페인팅용 파일 업로드)
const upload = multer({ storage: multer.memoryStorage() });

// Google 모델 목록 조회 API
app.get('/api/google/models', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const apiKey = authorization?.replace('Bearer ', '');

        if (!apiKey) {
            return res.status(401).json({ error: 'Google API 키가 필요합니다.' });
        }

        console.log('Google 모델 목록 조회 요청');

        // GoogleGenAI 클라이언트 생성
        const genAI = new GoogleGenAI({ apiKey: apiKey });

        // 모델 목록 조회
        const modelsList = await genAI.models.list();

        // Iterator를 배열로 변환
        const modelsArray = [];
        for await (const model of modelsList) {
            modelsArray.push(model);
        }

        console.log('Google 모델 목록 조회 성공:', modelsArray.length, '개 모델');
        
        res.json({
            models: modelsArray,
            count: modelsArray.length
        });

    } catch (error) {
        console.error('Google 모델 목록 조회 오류:', error);
        res.status(500).json({ 
            error: { 
                message: `서버 내부 오류: ${error.message}`,
                details: error.toString()
            } 
        });
    }
});

// Google Imagen3 API 프록시
app.post('/api/google/images/generate', async (req, res) => {
    try {
        const { authorization } = req.headers;
        const apiKey = authorization?.replace('Bearer ', '');

        if (!apiKey) {
            return res.status(401).json({ error: 'Google API 키가 필요합니다.' });
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

        // Imagen predict API의 요청 본문 형식
        const requestBody = {
            instances: [
                {
                    prompt: req.body.prompt
                }
            ],
            parameters: {
                ...(req.body.config || {})
            }
        };

        console.log('Google Imagen3 API 요청 (predict):', {
            prompt: req.body.prompt?.substring(0, 100) + '...',
            parameters: requestBody.parameters
        });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error('Google Imagen3 API 오류 (predict):', {
                status: response.status,
                responseText: responseText
            });
            return res.status(response.status).send(responseText);
        }

        const result = JSON.parse(responseText);
        console.log('Google Imagen3 API 성공 (predict)');
        
        // 결과를 OpenAI 형식과 비슷하게 변환
        const response_data = {
            data: result.predictions.map(pred => ({
                url: `data:image/png;base64,${pred.bytesBase64Encoded}`
            }))
        };
        
        res.json(response_data);

    } catch (error) {
        console.error('Google Imagen3 프록시 서버 오류:', error);
        res.status(500).json({ 
            error: { 
                message: `서버 내부 오류: ${error.message}`,
                details: error.toString()
            } 
        });
    }
});

// 이미지 생성 프록시 (OpenAI)
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

// 인페인팅 프록시 (주석 처리 - 임시 비활성화)
/*
app.post('/api/images/edits', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mask', maxCount: 1 }
]), async (req, res) => {
    console.log('🎨 [서버] 인페인팅 요청 받음');
    
    try {
        const { authorization } = req.headers;
        const apiKey = authorization?.replace('Bearer ', '');

        console.log('🔑 [서버] API 키 검증 중...');
        if (!apiKey) {
            console.error('❌ [서버] API 키 없음');
            return res.status(401).json({ error: 'API 키가 필요합니다.' });
        }
        console.log('✅ [서버] API 키 확인됨');

        console.log('📁 [서버] 파일 검증 중...');
        if (!req.files.image || !req.files.mask) {
            console.error('❌ [서버] 필수 파일 누락:', {
                hasImage: !!req.files.image,
                hasMask: !!req.files.mask
            });
            return res.status(400).json({ 
                error: { 
                    message: '이미지와 마스크 파일이 모두 필요합니다.' 
                } 
            });
        }
        console.log('✅ [서버] 파일 확인됨');

        // 파일 크기 체크 (gpt-image-1은 최대 50MB)
        console.log('📏 [서버] 파일 크기 검증 중...');
        const maxFileSize = 50 * 1024 * 1024; // 50MB
        if (req.files.image[0].size > maxFileSize || req.files.mask[0].size > maxFileSize) {
            console.error('❌ [서버] 파일 크기 초과:', {
                imageSize: req.files.image[0].size,
                maskSize: req.files.mask[0].size,
                maxSize: maxFileSize
            });
            return res.status(400).json({
                error: {
                    message: '파일 크기가 너무 큽니다. 최대 50MB까지 지원됩니다.'
                }
            });
        }
        console.log('✅ [서버] 파일 크기 확인됨');

        console.log('📝 [서버] 인페인팅 요청 상세:', {
            prompt: req.body.prompt,
            model: req.body.model,
            size: req.body.size,
            quality: req.body.quality,
            imageSize: req.files.image[0].size,
            maskSize: req.files.mask[0].size,
            imageType: req.files.image[0].mimetype,
            maskType: req.files.mask[0].mimetype
        });

        // FormData 생성
        console.log('📦 [서버] FormData 생성 중...');
        const formData = new FormData();
        formData.append('prompt', req.body.prompt);
        formData.append('model', req.body.model || 'gpt-image-1');
        formData.append('n', req.body.n || '1');
        formData.append('size', req.body.size || '1024x1024');
        formData.append('quality', req.body.quality || 'medium');
        
        // 이미지 파일들 추가
        formData.append('image', req.files.image[0].buffer, {
            filename: 'image.png',
            contentType: req.files.image[0].mimetype || 'image/png'
        });
        formData.append('mask', req.files.mask[0].buffer, {
            filename: 'mask.png',
            contentType: req.files.mask[0].mimetype || 'image/png'
        });
        console.log('✅ [서버] FormData 생성 완료');

        console.log('🚀 [서버] OpenAI API 호출 시작...');
        const startTime = Date.now();
        
        const response = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        const endTime = Date.now();
        console.log('📡 [서버] OpenAI API 응답 받음:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            duration: `${endTime - startTime}ms`
        });

        console.log('📊 [서버] 응답 데이터 파싱 중...');
        const data = await response.json();
        console.log('✅ [서버] 응답 데이터 파싱 완료');

        if (!response.ok) {
            console.error('❌ [서버] OpenAI 인페인팅 API 오류:', {
                status: response.status,
                statusText: response.statusText,
                error: data,
                requestSize: req.body.size,
                requestQuality: req.body.quality
            });
            return res.status(response.status).json(data);
        }

        console.log('🎉 [서버] 인페인팅 성공:', {
            imageCount: data.data?.length || 0,
            usage: data.usage,
            created: data.created
        });
        
        console.log('📤 [서버] 클라이언트로 응답 전송 중...');
        res.json(data);
        console.log('✅ [서버] 응답 전송 완료');

    } catch (error) {
        console.error('💥 [서버] 인페인팅 프록시 서버 오류:', {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
            files: req.files ? Object.keys(req.files) : 'none'
        });
        res.status(500).json({ 
            error: { 
                message: `인페인팅 서버 내부 오류: ${error.message}` 
            } 
        });
    }
});
*/

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
        uptime: process.uptime(),
        features: {
            openai: true,
            google_imagen: true,
            inpainting: false // 임시 비활성화
        }
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
    console.log(`🚀 AI 이미지 생성 프록시 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`📊 건강 체크: http://localhost:${PORT}/api/health`);
    console.log(`🎨 지원 모델: OpenAI (DALL-E 2, 3, gpt-image-1), Google Imagen 3`);
    console.log(`⚠️  인페인팅 기능은 현재 비활성화되어 있습니다.`);
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