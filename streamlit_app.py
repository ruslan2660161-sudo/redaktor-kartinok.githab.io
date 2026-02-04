
import streamlit as st
from PIL import Image
import io
import zipfile
import os

# --- Configuration ---
st.set_page_config(
    page_title="Mass Image Processor Pro",
    page_icon="🖼️",
    layout="wide"
)

def process_image(img, target_width, target_height, padding_ratio=0.15):
    """
    Resizes image to fit target dimensions with white background and padding.
    Logic identical to the React canvas implementation.
    """
    # Create white background
    background = Image.new('RGB', (target_width, target_height), (255, 255, 255))
    
    # Calculate available area with padding
    avail_w = target_width * (1 - 2 * padding_ratio)
    avail_h = target_height * (1 - 2 * padding_ratio)
    
    # Resize keeping aspect ratio (Fit/Contain)
    # Copy image to not modify original in loop
    img_copy = img.copy()
    img_copy.thumbnail((int(avail_w), int(avail_h)), Image.Resampling.LANCZOS)
    
    # Calculate offset to center
    offset_x = (target_width - img_copy.width) // 2
    offset_y = (target_height - img_copy.height) // 2
    
    background.paste(img_copy, (offset_x, offset_y))
    return background

# --- Session State for Formats ---
if 'formats' not in st.session_state:
    st.session_state.formats = [
        {"id": "1", "label": "Square (1:1)", "w": 1000, "h": 1000},
        {"id": "2", "label": "Portrait (Instagram/Ozon)", "w": 1080, "h": 1320},
        {"id": "3", "label": "Landscape (Horizontal)", "w": 1080, "h": 607}
    ]

# --- Sidebar: Format Settings ---
st.sidebar.header("⚙️ Target Formats")
st.sidebar.write("Define sizes for batch export.")

new_formats = []
for i, fmt in enumerate(st.session_state.formats):
    with st.sidebar.expander(f"Format: {fmt['label']}", expanded=False):
        col1, col2 = st.columns(2)
        label = st.text_input("Label", fmt['label'], key=f"lab_{i}")
        with col1:
            w = st.number_input("Width", value=fmt['w'], min_value=1, key=f"w_{i}")
        with col2:
            h = st.number_input("Height", value=fmt['h'], min_value=1, key=f"h_{i}")
        
        if st.button("🗑️ Remove", key=f"del_{i}"):
            st.session_state.formats.pop(i)
            st.rerun()
        
        new_formats.append({"id": fmt['id'], "label": label, "w": w, "h": h})

st.session_state.formats = new_formats

if st.sidebar.button("➕ Add New Format"):
    st.session_state.formats.append({
        "id": os.urandom(4).hex(),
        "label": "New Custom Format",
        "w": 1080,
        "h": 1080
    })
    st.rerun()

# --- Main UI ---
st.title("Mass Image Processor Pro")
st.markdown("Batch resize and export images with white padding locally using Python/Pillow.")

uploaded_files = st.file_uploader(
    "Upload Images", 
    type=['png', 'jpg', 'jpeg', 'webp'], 
    accept_multiple_files=True,
    help="Select one or multiple images to process."
)

if uploaded_files:
    st.info(f"📁 {len(uploaded_files)} files ready for processing.")
    
    if st.button("🚀 Run Automation", type="primary", use_container_width=True):
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            for idx, uploaded_file in enumerate(uploaded_files):
                # Load image
                try:
                    raw_img = Image.open(uploaded_file).convert("RGB")
                    base_name = uploaded_file.name.rsplit('.', 1)[0]
                    
                    for fmt in st.session_state.formats:
                        # Process
                        processed_img = process_image(raw_img, fmt['w'], fmt['h'])
                        
                        # Save to buffer
                        img_byte_arr = io.BytesIO()
                        processed_img.save(img_byte_arr, format='JPEG', quality=95, subsampling=0)
                        
                        # Add to ZIP
                        filename = f"{base_name}_{fmt['w']}x{fmt['h']}.jpg"
                        zip_file.writestr(filename, img_byte_arr.getvalue())
                        
                except Exception as e:
                    st.error(f"Error processing {uploaded_file.name}: {e}")
                
                # Update progress
                progress = (idx + 1) / len(uploaded_files)
                progress_bar.progress(progress)
                status_text.text(f"Processing {idx + 1}/{len(uploaded_files)}: {uploaded_file.name}")
            
            status_text.text("✅ All images processed successfully!")
            
        # Download Button
        st.divider()
        st.success("Archive generated!")
        st.download_button(
            label="💾 Download All Results (ZIP)",
            data=zip_buffer.getvalue(),
            file_name=f"processed_images.zip",
            mime="application/zip",
            use_container_width=True
        )

else:
    st.write("---")
    st.caption("Waiting for files to be uploaded...")

# Footer
st.sidebar.divider()
st.sidebar.caption("High-performance Python Image Processing")
