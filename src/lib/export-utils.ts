/**
 * @file export-utils.ts
 * @description Funciones de utilidad para exportar datos de interacciones a diferentes formatos (TXT, PDF, Audio).
 */

/**
 * Exporta una transcripción de llamada en formato de texto plano (.txt).
 * 
 * @param transcript - El contenido de la transcripción.
 * @param callDate - La fecha de la llamada para incluir en el encabezado y nombre de archivo.
 * @param status - Opcional. El estado de la interacción (exitoso, fallido, etc.).
 */
export const exportTranscriptAsTXT = (
    transcript: string,
    callDate: string,
    status?: string
) => {
    const header = `TRANSCRIPCIÓN DE LLAMADA
Fecha: ${new Date(callDate).toLocaleString('es-AR')}
Estado: ${status || 'N/A'}
${'='.repeat(60)}

`
    const content = header + transcript

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transcripcion_${new Date(callDate).toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Exporta una transcripción de llamada en formato PDF.
 * Actualmente utiliza una ventana de impresión integrada del navegador para generar el documento.
 * Incluye metadatos, transcripción y notas de la llamada.
 * 
 * @param transcript - El contenido de la transcripción.
 * @param callDate - La fecha de la llamada.
 * @param status - Opcional. El estado de la interacción.
 * @param notes - Opcional. Notas adicionales guardadas por el usuario.
 */
export const exportTranscriptAsPDF = async (
    transcript: string,
    callDate: string,
    status?: string,
    notes?: string
) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transcripción de Llamada</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h1 {
            color: #4F46E5;
            margin: 0 0 10px 0;
        }
        .metadata {
            color: #666;
            font-size: 14px;
        }
        .metadata span {
            display: inline-block;
            margin-right: 20px;
        }
        .section {
            margin: 30px 0;
        }
        .section-title {
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .transcript {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            white-space: pre-wrap;
            font-size: 14px;
        }
        .notes {
            background: #fef3c7;
            padding: 15px;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
            font-size: 14px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Transcripción de Llamada</h1>
        <div class="metadata">
            <span><strong>Fecha:</strong> ${new Date(callDate).toLocaleString('es-AR')}</span>
            <span><strong>Estado:</strong> ${status || 'N/A'}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Transcripción Completa</div>
        <div class="transcript">${transcript}</div>
    </div>

    ${notes ? `
    <div class="section">
        <div class="section-title">Notas</div>
        <div class="notes">${notes}</div>
    </div>
    ` : ''}

    <div class="footer">
        Generado por AsistenteSDR - ${new Date().toLocaleDateString('es-AR')}
    </div>

    <script>
        window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 100);
        }
    </script>
</body>
</html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
}

/**
 * Descarga el archivo de audio de la llamada desde una URL pública.
 * 
 * @param audioUrl - URL del archivo de audio (ej. de Supabase Storage).
 * @param callDate - Fecha de la llamada para nombrar el archivo.
 */
export const downloadAudio = (audioUrl: string, callDate: string) => {
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `llamada_${new Date(callDate).toISOString().split('T')[0]}.webm`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
