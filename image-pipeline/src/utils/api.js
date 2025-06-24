// OpenAI API 호출 유틸리티 함수들

/**
 * base64 이미지 데이터를 data URI로 변환
 * @param {string} base64Data - base64 인코딩된 이미지 데이터
 * @param {string} format - 이미지 포맷 (기본값: png)
 * @returns {string} data URI
 */
export function base64ToDataUri(base64Data, format = 'png') {
    return `data:image/${format};base64,${base64Data}`;
}

/**
 * 응답 데이터를 통일된 형식으로 변환 (url 속성을 가지도록)
 * @param {Array} responseData - API 응답의 data 배열
 * @returns {Array} 통일된 형식의 이미지 데이터 배열
 */
export function normalizeImageResponse(responseData) {
    return responseData.map(item => {
        if (item.b64_json) {
            // b64_json이 있으면 data URI로 변환하여 url 속성에 저장
            return {
                url: base64ToDataUri(item.b64_json),
                b64_json: item.b64_json // 원본 데이터도 보존
            };
        }
        // url이 있으면 그대로 사용
        return item;
    });
}

/**
 * 이미지 생성 API 호출
 * @param {Object} params - 이미지 생성 파라미터
 * @returns {Promise<Object>} API 응답
 */
export async function generateImage(apiKey, params) {
    const endpoint = '/api/images/generations';
    
    const requestBody = {
        model: params.model,
        prompt: params.prompt,
        size: params.size
    };

    // 모델별 품질 및 응답 형식 설정
    if (params.model === 'dall-e-3') {
        requestBody.quality = params.quality;
        requestBody.response_format = params.responseFormat || 'url';
        
        // DALL-E 3 전용 파라미터
        if (params.style) {
            requestBody.style = params.style;
        }
        
        // DALL-E 3는 한 번에 1개 이미지만 생성 가능하므로 여러 이미지 요청 시 병렬 호출
        if (params.numImages > 1) {
            console.log(`DALL-E 3로 ${params.numImages}개 이미지 생성을 위해 ${params.numImages}번의 병렬 API 호출 시작`);
            
            // 각 호출은 n=1로 설정
            const singleRequestBody = {
                ...requestBody,
                n: 1
            };
            
            // Promise.all을 사용하여 병렬 호출
            const promises = Array.from({ length: params.numImages }, async (_, index) => {
                console.log(`DALL-E 3 API 호출 ${index + 1}/${params.numImages} 시작`);
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(singleRequestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`API 호출 ${index + 1} 실패: ${errorData.error?.message || `HTTP ${response.status}`}`);
                }

                const result = await response.json();
                console.log(`DALL-E 3 API 호출 ${index + 1}/${params.numImages} 완료`);
                return result;
            });

            try {
                // 모든 호출이 완료될 때까지 대기
                const results = await Promise.all(promises);
                
                // 모든 결과를 하나로 합치기
                const combinedData = results.flatMap(result => result.data || []);
                
                console.log(`DALL-E 3 병렬 호출 완료: 총 ${combinedData.length}개 이미지 생성`);
                
                // 응답 데이터를 통일된 형식으로 변환
                const normalizedData = normalizeImageResponse(combinedData);
                
                return {
                    data: normalizedData,
                    created: results[0]?.created || Date.now(),
                    // 사용량 정보는 첫 번째 결과에서 가져오거나 합산 (사용량 정보가 있는 경우)
                    usage: results[0]?.usage || undefined
                };
                
            } catch (error) {
                console.error('DALL-E 3 병렬 호출 중 오류:', error);
                throw error;
            }
        } else {
            // 단일 이미지 요청은 기존 방식 사용
            requestBody.n = 1;
        }
    } else if (params.model === 'gpt-image-1') {
        requestBody.quality = params.quality;
        requestBody.n = params.numImages;
        
        // gpt-image-1 전용 파라미터
        if (params.background) {
            requestBody.background = params.background;
        }
        if (params.outputFormat) {
            requestBody.output_format = params.outputFormat;
        }
        if (params.outputCompression !== undefined) {
            requestBody.output_compression = params.outputCompression;
        }
        // gpt-image-1은 response_format 파라미터를 지원하지 않으며 항상 b64_json으로 응답
    } else if (params.model === 'dall-e-2') {
        requestBody.n = params.numImages;
        requestBody.response_format = params.responseFormat || 'url';
    }

    // 단일 API 호출 (DALL-E 3에서 단일 이미지이거나 다른 모델들)
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    // 응답 데이터를 통일된 형식으로 변환
    if (result.data) {
        result.data = normalizeImageResponse(result.data);
    }

    return result;
}

/**
 * 인페인팅 API 호출
 * @param {string} apiKey - OpenAI API 키
 * @param {Object} params - 인페인팅 파라미터
 * @returns {Promise<Object>} API 응답
 */
export async function performInpainting(apiKey, params) {
    console.log('🎨 [인페인팅] 시작 - API 호출 준비');
    const endpoint = '/api/images/edits';
    
    const formData = new FormData();
    formData.append('prompt', params.prompt);
    formData.append('image', params.image, 'image.png');
    formData.append('mask', params.mask, 'mask.png');
    formData.append('model', 'gpt-image-1'); // gpt-image-1만 인페인팅 지원
    formData.append('n', '1');
    
    // 크기와 품질 파라미터 추가
    formData.append('size', params.size || '1024x1024');
    formData.append('quality', params.quality || 'medium');

    console.log('📝 [인페인팅] 요청 파라미터:', {
        prompt: params.prompt,
        size: params.size || '1024x1024',
        quality: params.quality || 'medium',
        imageSize: params.image.size,
        maskSize: params.mask.size
    });

    console.log('🚀 [인페인팅] 서버로 요청 전송 시작...');
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        console.log('📡 [인페인팅] 서버 응답 받음:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            console.error('❌ [인페인팅] HTTP 에러 발생');
            let errorData;
            try {
                errorData = await response.json();
                console.error('❌ [인페인팅] 에러 데이터:', errorData);
            } catch (parseError) {
                console.error('❌ [인페인팅] 에러 응답 파싱 실패:', parseError);
                errorData = { error: { message: `HTTP ${response.status}: 응답 파싱 실패` } };
            }
            
            console.error('❌ [인페인팅] API 오류 상세:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(errorData.error?.message || `HTTP ${response.status}: 인페인팅 요청이 실패했습니다.`);
        }

        console.log('📊 [인페인팅] 응답 데이터 파싱 시작...');
        const result = await response.json();
        
        console.log('✅ [인페인팅] 성공:', {
            imageCount: result.data?.length || 0,
            usage: result.usage,
            created: result.created
        });
        
        // gpt-image-1의 b64_json 응답을 통일된 형식으로 변환
        if (result.data) {
            console.log('🔄 [인페인팅] 이미지 데이터 정규화 중...');
            result.data = normalizeImageResponse(result.data);
            console.log('✅ [인페인팅] 이미지 데이터 정규화 완료');
        }

        console.log('🎉 [인페인팅] 전체 프로세스 완료!');
        return result;
        
    } catch (error) {
        console.error('💥 [인페인팅] fetch 오류 발생:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

/**
 * 이미지 다운로드
 * @param {string} url - 이미지 URL
 * @param {string} filename - 저장할 파일명
 * @returns {Promise<void>}
 */
export async function downloadImage(url, filename) {
    if (!url) {
        throw new Error('이미지 URL이 없습니다.');
    }

    console.log('이미지 다운로드 시도:', url);

    // 프록시를 통해 이미지 다운로드 (CORS 해결)
    const proxyUrl = `/api/download-image?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
        throw new Error(`다운로드 실패: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

/**
 * 캔버스를 Blob으로 변환 (인페인팅용)
 * @param {HTMLCanvasElement} canvas - 캔버스 엘리먼트
 * @param {ImageData} originalImageData - 원본 이미지 데이터
 * @param {string} type - 'original' 또는 'mask'
 * @returns {Promise<Blob>} 이미지 Blob
 */
export function canvasToBlob(canvas, originalImageData, type) {
    return new Promise((resolve) => {
        if (type === 'original') {
            // 원본 이미지만 추출
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            
            if (originalImageData) {
                tempCtx.putImageData(originalImageData, 0, 0);
            }
            
            tempCanvas.toBlob(resolve, 'image/png');
        } else {
            // 마스크만 추출 (흰색 브러시 부분을 투명하게)
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // 마스크 생성 - 개선된 로직
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r + g + b) / 3;
                
                if (brightness > 128) {
                    // 밝은 부분 (브러시 부분) -> 완전 투명 (편집될 영역)
                    data[i] = 0;     // R
                    data[i + 1] = 0; // G
                    data[i + 2] = 0; // B
                    data[i + 3] = 0; // A (투명)
                } else {
                    // 어두운 부분 -> 완전 불투명 검정 (보존될 영역)
                    data[i] = 0;     // R
                    data[i + 1] = 0; // G
                    data[i + 2] = 0; // B
                    data[i + 3] = 255; // A (불투명)
                }
            }
            
            tempCtx.putImageData(imageData, 0, 0);
            tempCanvas.toBlob(resolve, 'image/png');
        }
    });
}

/**
 * 이미지 파일을 캔버스에 로드
 * @param {File} file - 이미지 파일
 * @param {HTMLCanvasElement} canvas - 대상 캔버스
 * @returns {Promise<ImageData>} 로드된 이미지 데이터
 */
export function loadImageToCanvas(file, canvas) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                
                // 캔버스 크기에 맞게 이미지 조정
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (canvas.width - scaledWidth) / 2;
                const y = (canvas.height - scaledHeight) / 2;

                // 캔버스 초기화
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 이미지 그리기
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                
                // 이미지 데이터 반환
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                resolve(imageData);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * URL에서 이미지를 캔버스에 로드 (data URI 및 일반 URL 모두 지원)
 * @param {string} imageUrl - 이미지 URL 또는 data URI
 * @param {HTMLCanvasElement} canvas - 대상 캔버스
 * @returns {Promise<ImageData>} 로드된 이미지 데이터
 */
export function loadImageUrlToCanvas(imageUrl, canvas) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        // data URI가 아닌 경우에만 crossOrigin 설정
        if (!imageUrl.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        
        img.onload = () => {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            // 캔버스 크기에 맞게 이미지 조정
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const x = (canvas.width - scaledWidth) / 2;
            const y = (canvas.height - scaledHeight) / 2;

            // 캔버스 초기화
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 이미지 그리기
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
            
            // 이미지 데이터 반환
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            resolve(imageData);
        };
        img.onerror = (error) => {
            console.error('이미지 로드 실패:', error);
            reject(new Error('이미지를 로드할 수 없습니다.'));
        };
        img.src = imageUrl;
    });
} 