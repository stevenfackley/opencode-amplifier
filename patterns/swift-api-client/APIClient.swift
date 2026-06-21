// Typed Swift client over another team's REST contract, with an anti-corruption layer.
// The wire DTO mirrors THEIR contract; the domain type is designed for YOUR app; toDomain() is
// the one place the two meet.

import Foundation

// --- Wire DTO: mirrors the shared contract exactly. Keep it dumb; never use it in the app core. ---
struct WidgetDTO: Decodable {
    let id: String
    let displayName: String
    let qty: Int?

    // Map the backend's snake_case to Swift names (or use decoder.keyDecodingStrategy instead).
    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case qty
    }
}

// --- Domain model: designed for the app, decoupled from the wire shape. ---
struct Widget: Equatable, Sendable {
    let id: UUID
    let name: String
    let quantity: Int
}

// Anti-corruption mapping: the ONLY place their shape meets yours. Their rename = one-line change.
extension WidgetDTO {
    func toDomain() throws -> Widget {
        guard let uuid = UUID(uuidString: id) else { throw APIError.decoding("bad id: \(id)") }
        return Widget(id: uuid, name: displayName, quantity: qty ?? 0)
    }
}

enum APIError: Error, Equatable {
    case http(Int)
    case decoding(String)
    case transport(String)
}

struct APIClient {
    let baseURL: URL
    var session: URLSession = .shared

    func widgets() async throws -> [Widget] {
        let url = baseURL.appendingPathComponent("widgets")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(from: url)
        } catch {
            throw APIError.transport(error.localizedDescription)
        }

        guard let http = response as? HTTPURLResponse else { throw APIError.transport("no response") }
        guard (200..<300).contains(http.statusCode) else { throw APIError.http(http.statusCode) }

        let dtos: [WidgetDTO]
        do {
            dtos = try JSONDecoder().decode([WidgetDTO].self, from: data)
        } catch {
            throw APIError.decoding(String(describing: error)) // never force-unwrap a decode
        }

        return try dtos.map { try $0.toDomain() } // cross the ACL exactly once, return domain types
    }
}
