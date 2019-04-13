import "allocator/tlsf";

export function toGrayscale(ptr:i32, length:i32, distPtr:i32) :void {
    for (let i = 0; i < length; i += 4) {
        let gray = (load<u8>(ptr + i) + load<u8>(ptr + i + 1) + load<u8>(ptr + i + 2)) / 3;
        store<u8>(distPtr + i, gray);
        store<u8>(distPtr + i + 1, gray);
        store<u8>(distPtr + i + 2, gray);
        store<u8>(distPtr + i + 3, load<u8>(ptr + i + 3));
    }
}

export function allocate(size: i32) :i32 {
    return memory.allocate(size);
}

export function freeBuffer(ptr: usize) :void {
    memory.free(ptr)
}


