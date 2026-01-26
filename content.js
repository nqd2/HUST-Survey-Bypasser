function executeAutoFill() {
    console.log("Đang chạy tool tự động điền...");

    // params: keys ['enableAlert', 'enableAutoFill']
    // output: result contains settings
    chrome.storage.sync.get(['enableAlert', 'enableAutoFill'], function(result) {
        const shouldAutoFill = result.enableAutoFill !== false;
        
        if (!shouldAutoFill) {
            console.log("Tự động điền đang tắt.");
            return;
        }

        const shouldAlert = result.enableAlert !== false; 
        
        const labels = document.querySelectorAll('td.dxichTextCellSys label.dx-wrap');
        let count = 0;

        labels.forEach(label => {
            const text = label.innerText.trim();
            // filter text starts with "4." or "4:"
            if (text.startsWith("4.") || text.startsWith("4:")) {
                const labelTd = label.closest('td.dxichTextCellSys');
                if (labelTd) {
                    const row = labelTd.parentElement;
                    const radioTd = row.querySelector('td.dxichCellSys');
                    if (radioTd) {
                        const radioButton = radioTd.querySelector('span.dxeIRadioButton_Mulberry');
                        if (radioButton) {
                            radioButton.click();
                            count++;
                        }
                    }
                }
            }
        });

        console.log(`Đã chọn xong ${count} mục.`);

        const submitBtn = document.querySelector('div[id$="submitButton"]'); 
        const submitInput = document.querySelector('input[id$="submitButton_I"]');

        if (submitBtn || submitInput) {
            // delay 500ms
            setTimeout(() => {
                if(submitInput) {
                    submitInput.click();
                } else {
                    submitBtn.click();
                }
                
                if (shouldAlert) {
                    alert("Đã điền và bấm gửi xong!");
                }
            }, 500);
        } else {
            if (shouldAlert) {
                alert("Đã điền xong nhưng không tìm thấy nút Gửi. Bạn hãy bấm tay nhé.");
            }
        }
    });
}

window.addEventListener('load', executeAutoFill);
