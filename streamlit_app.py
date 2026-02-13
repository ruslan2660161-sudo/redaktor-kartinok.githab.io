
import streamlit as st
from PIL import Image, ImageFilter, ImageOps
import io
import zipfile
import os

# --- Configuration ---
st.set_page_config(
    page_title="Ресайзы для баннеров ЧГ",
    page_icon="🖼️",
    layout="wide"
)

# --- Custom Styling ---
st.markdown("""
    <style>
    /* Global Background and Typography */
    .stApp {
        background-color: #f8fafc;
        color: #0f172a;
    }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #ffffff !important;
        border-right: 1px solid #e2e8f0;
    }
    
    /* Card-like containers for sidebar expanders */
    div[data-testid="stExpander"] {
        background-color: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 12px;
        margin-bottom: 8px;
    }
    
    /* Primary Action Button styling */
    div.stButton > button[kind="primary"] {
        background-color: #4f46e5;
        border-color: #4338ca;
        color: white;
        border-radius: 16px;
        padding: 1rem;
        font-weight: 700;
        font-size: 1.1rem;
        box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.2);
        transition: all 0.2s;
    }
    div.stButton > button[kind="primary"]:hover {
        background-color: #4338ca;
        transform: translateY(-2px);
    }
    
    /* Secondary and Other Buttons */
    div.stButton > button {
        border-radius: 10px;
    }
    
    /* File Uploader styling */
    section[data-testid="stFileUploadDropzone"] {
        border-radius: 24px;
        border: 2px dashed #cbd5e1;
        background-color: #ffffff;
    }
    section[data-testid="stFileUploadDropzone"]:hover {
        border-color: #4f46e5;
        background-color: #f5f3ff;
    }
    
    /* Titles and Headings */
    h1 {
        font-weight: 800 !important;
        color: #0f172a !important;
    }
    .main-description {
        color: #64748b;
        margin-bottom: 2rem;
    }
    
    /* Progress bar indigo color */
    .stProgress > div > div > div > div {
        background-color: #4f46e5;
    }
    </style>
""", unsafe_allow_html=True)

def process_image(img, target_width, target_height, padding_ratio=0.05, apply_shadow=False, background_color="#FFFFFF"):
    """
    Resizes image to fit target dimensions with custom background, padding and optional drop shadow.
    """
    # Create background with chosen color
    background = Image.new('RGB', (target_width, target_height), background_color)
    
    # Calculate available area with padding
    avail_w = target_width * (1 - 2 * padding_ratio)
    avail_h = target_height * (1 - 2 * padding_ratio)
    
    # Resize keeping aspect ratio (Fit/Contain)
    img_copy = img.copy()
    img_copy.thumbnail((int(avail_w), int(avail_h)), Image.Resampling.LANCZOS)
    
    # Calculate offset to center
    offset_x = (target_width - img_copy.width) // 2
    offset_y = (target_height - img_copy.height) // 2
    
    if apply_shadow:
        if img_copy.mode != 'RGBA':
            img_copy_rgba = img_copy.convert('RGBA')
        else:
            img_copy_rgba = img_copy
            
        blur_radius = 20
        shadow_margin = blur_radius * 2
        shadow_canvas = Image.new('RGBA', (img_copy.width + shadow_margin * 2, img_copy.height + shadow_margin * 2), (0, 0, 0, 0))
        
        alpha = img_copy_rgba.split()[-1]
        shadow_color = (0, 0, 0, int(255 * 0.4)) 
        shadow_shape = Image.new('RGBA', img_copy.size, shadow_color)
        
        shadow_canvas.paste(shadow_shape, (shadow_margin, shadow_margin), mask=alpha)
        shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        
        background.paste(
            shadow_canvas, 
            (offset_x + 10 - shadow_margin, offset_y - 10 - shadow_margin), 
            mask=shadow_canvas
        )
    
    if img_copy.mode == 'RGBA':
        background.paste(img_copy, (offset_x, offset_y), mask=img_copy)
    else:
        background.paste(img_copy, (offset_x, offset_y))
        
    return background

# --- Sidebar Configuration ---
with st.sidebar:
    st.markdown("### ⚙️ Target Formats")
    
    # Session State for Formats
    if 'formats' not in st.session_state:
        st.session_state.formats = [
            {"id": "1", "label": "Square (1:1)", "w": 1000, "h": 1000},
            {"id": "2", "label": "Portrait (Instagram/Ozon)", "w": 1080, "h": 1350},
            {"id": "3", "label": "Landscape (Horizontal)", "w": 1080, "h": 607}
        ]

    # Render formats list
    updated_formats = []
    for i, fmt in enumerate(st.session_state.formats):
        with st.expander(f"📦 {fmt['label']}", expanded=False):
            label = st.text_input("Label", fmt['label'], key=f"lab_{i}")
            col_w, col_h = st.columns(2)
            with col_w:
                w = st.number_input("Width", value=fmt['w'], min_value=1, key=f"w_{i}")
            with col_h:
                h = st.number_input("Height", value=fmt['h'], min_value=1, key=f"h_{i}")
            
            if st.button("🗑️ Remove Format", key=f"del_{i}"):
                st.session_state.formats.pop(i)
                st.rerun()
            updated_formats.append({"id": fmt['id'], "label": label, "w": w, "h": h})
    
    st.session_state.formats = updated_formats

    if st.button("➕ Add New Format", use_container_width=True):
        st.session_state.formats.append({
            "id": os.urandom(4).hex(),
            "label": "Custom Size",
            "w": 1080,
            "h": 1080
        })
        st.rerun()

    st.divider()
    st.markdown("### ✨ Styling")
    bg_color = st.color_picker("Background Color", "#FFFFFF")
    apply_shadow = st.checkbox("Добавить тень (Drop Shadow)", value=False)
    
    st.divider()
    st.caption("Local Processing: ON")
    st.caption("© 2025 Ресайзы для баннеров ЧГ")

# --- Main Interface ---
col_main, _ = st.columns([3, 0.1])

with col_main:
    st.title("Ресайзы для баннеров ЧГ")
    st.markdown('<p class="main-description">Массово делаем ресайзы для баннеров и книг</p>', unsafe_allow_html=True)

    uploaded_files = st.file_uploader(
        "Upload Images", 
        type=['png', 'jpg', 'jpeg', 'webp'], 
        accept_multiple_files=True
    )

    if uploaded_files:
        st.markdown(f"**{len(uploaded_files)} files selected.**")
        
        if st.button("🚀 Run Automation", type="primary", use_container_width=True):
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
                progress_bar = st.progress(0)
                status_text = st.empty()
                
                for idx, uploaded_file in enumerate(uploaded_files):
                    try:
                        raw_img = Image.open(uploaded_file)
                        if raw_img.mode != 'RGBA':
                            raw_img = raw_img.convert('RGBA')
                            
                        base_name = uploaded_file.name.rsplit('.', 1)[0]
                        
                        for fmt in st.session_state.formats:
                            processed_img = process_image(
                                raw_img, 
                                fmt['w'], 
                                fmt['h'], 
                                apply_shadow=apply_shadow, 
                                background_color=bg_color
                            )
                            
                            img_byte_arr = io.BytesIO()
                            processed_img.convert('RGB').save(img_byte_arr, format='JPEG', quality=95, subsampling=0)
                            
                            filename = f"{base_name}_{fmt['w']}x{fmt['h']}.jpg"
                            zip_file.writestr(filename, img_byte_arr.getvalue())
                            
                    except Exception as e:
                        st.error(f"Error processing {uploaded_file.name}: {e}")
                    
                    progress = (idx + 1) / len(uploaded_files)
                    progress_bar.progress(progress)
                    status_text.text(f"Processing: {uploaded_file.name} ({idx+1}/{len(uploaded_files)})")
                
                status_text.success("✅ Done! Your images are ready.")
            
            st.divider()
            st.download_button(
                label="💾 Download ZIP Archive",
                data=zip_buffer.getvalue(),
                file_name=f"banner_resizes_{os.urandom(2).hex()}.zip",
                mime="application/zip",
                use_container_width=True
            )
    else:
        # Empty state display
        st.markdown("""
            <div style="padding: 100px 0; text-align: center; opacity: 0.5;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <p style="margin-top: 10px; font-weight: 500;">No images uploaded</p>
            </div>
        """, unsafe_allow_html=True)
